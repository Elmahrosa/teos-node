import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import {
parseDomain,
  isNotForSaleDomain,
} from "../../../lib/domain-rules";
import {
getQuote,
  markUsed,
  GRACE_MS,
} from "../../../lib/quoteStore";
import { verifyWalletSignature } from "../../../lib/sig";
import {
isClaimed,
  claimDomain,
  releaseDomain,
  recordMint,
  incrSold,
  getClaim,
  claimTx,
  releaseTx,
  registryPersistent,
  logPendingMint,
} from "../../../lib/registry";
import { env } from "../../../lib/env";
import { verifyPayment } from "../../../lib/payment";
import { mintTeosAsset, mintFunds } from "../../../lib/mint";
import { fullName } from "../../../lib/tlds";
const bad = (reason: string) =>
  NextResponse.json(
    { error: "invalid_quote", reason },
    { status: 401 }
  );

async function rollbackClaims(
  claimed: string[],
  publicKey: string,
  paymentTx: string,
  domain: string
): Promise<void> {
  try {
    for (const claimedDomain of claimed) {
      try {
        await releaseDomain(claimedDomain, publicKey, paymentTx);
      } catch (error: any) {
        console.error(
          "[register] domain_rollback_failed",
          JSON.stringify({
            domain: claimedDomain,
            error: String(error?.message ?? error).slice(0, 200),
          })
        );
      }
    }
  } finally {
    try {
      await releaseTx(paymentTx, domain);
    } catch (error: any) {
      console.error(
        "[register] payment_rollback_failed",
        JSON.stringify({
          error: String(error?.message ?? error).slice(0, 200),
        })
      );
    }
  }
}

export async function POST(req: Request) {
  const rl = await checkRateLimit("register", 10, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  // Registration remains closed unless explicitly enabled.
  if (env("REGISTRATION_OPEN") !== "true") {
    return NextResponse.json(
      { error: "registration_closed" },
      {
        status: 503,
        headers: { "Retry-After": "3600" },
      }
    );
  }

  const treasury = env("TREASURY_WALLET");
  const hasHelius = !!(
    env("HELIUS_API_KEY") || env("HELIUS_RPC_URL")
  );

  const storageOk =
    registryPersistent ||
    process.env.NODE_ENV !== "production" ||
    env("ALLOW_MEMORY_REGISTRY") === "true";

  if (!treasury || !hasHelius || !storageOk) {
    console.error(
      `[register] not_configured: TREASURY_WALLET=${!!treasury} HELIUS=${hasHelius} UPSTASH_URL=${!!env("UPSTASH_REDIS_REST_URL")} UPSTASH_TOKEN=${!!env("UPSTASH_REDIS_REST_TOKEN")} persistent_registry=${registryPersistent}`
    );

    return NextResponse.json(
      {
        error: "registration_closed",
        reason: "not_configured",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      quote_id,
      signature,
      publicKey,
      payment_tx,
    } = body ?? {};

    const parsed = parseDomain(body?.domain);

    if (!parsed.ok) {
      return NextResponse.json(parsed.body, {
        status: parsed.status,
      });
    }

    if (isNotForSaleDomain(parsed.domain)) {
      return NextResponse.json(
        { error: "NOT_FOR_SALE" },
        { status: 409 }
      );
    }

    if (
      [quote_id, signature, publicKey, payment_tx].some(
        (value) =>
          typeof value !== "string" || !value
      )
    ) {
      return NextResponse.json(
        { error: "missing_signature_or_quote" },
        { status: 400 }
      );
    }

    const quote = await getQuote(quote_id);

    if (!quote) return bad("not_found_or_expired");
    if (quote.used) return bad("already_used");
    if (quote.domain !== parsed.domain) {
      return bad("domain_mismatch");
    }

    if (Date.now() > quote.expiresAt + GRACE_MS) {
      return bad("expired");
    }

    if (
      !(await verifyWalletSignature(
        quote.message,
        signature,
        publicKey
      ))
    ) {
      return NextResponse.json(
        { error: "invalid_signature" },
        { status: 401 }
      );
    }

    const tlds = quote.tlds ?? ["teos"];

    for (const tld of tlds) {
      if (await isClaimed(fullName(quote.domain, tld))) {
        return NextResponse.json(
          {
            error: "already_minted",
            tld,
          },
          { status: 401 }
        );
      }
    }

    // Other TLDs require the matching .teos identity
    // to be included in this basket or already owned.
    if (!tlds.includes("teos")) {
      const own = await getClaim(quote.domain);

      if (!own || own.owner !== publicKey) {
        return NextResponse.json(
          {
            error: "teos_required",
            message: "Register the .teos name first.",
          },
          { status: 403 }
        );
      }
    }

    // Check mint wallet capacity before payment consumption.
    const funds = await mintFunds(tlds.length);

    if (!funds.ok) {
      return NextResponse.json(
        { error: "mint_unavailable" },
        { status: 503 }
      );
    }

    const pay = await verifyPayment({
      txSignature: payment_tx,
      payer: publicKey,
      treasury,
      minLamports: quote.priceLamports,
    });

    if (!pay.ok) {
      console.error(
        "[register] payment_not_verified",
        JSON.stringify({
          reason: pay.reason,
          payment_tx,
          payer: publicKey,
          treasury,
          domain: quote.domain,
          detail: pay.detail,
        })
      );

      const status =
        pay.reason === "rpc_unavailable" ? 503 : 402;

      return NextResponse.json(
        {
          error: "payment_not_verified",
          reason: pay.reason,
        },
        { status }
      );
    }

    // Prevent reuse of the same payment transaction.
    if (!(await claimTx(payment_tx, quote.domain))) {
      return NextResponse.json(
        { error: "payment_already_used" },
        { status: 409 }
      );
    }

    const claimed: string[] = [];

    // Claim every requested TLD.
    for (const tld of tlds) {
      const domainName = fullName(quote.domain, tld);

      if (
        !(await claimDomain(
          domainName,
          publicKey,
          payment_tx
        ))
      ) {
        await rollbackClaims(
          claimed,
          publicKey,
          payment_tx,
          quote.domain
        );

        return NextResponse.json(
          {
            error: "already_minted",
            tld,
          },
          { status: 409 }
        );
      }

      claimed.push(domainName);
    }

    // Consume the quote after all claims have succeeded.
    await markUsed(quote.id);

    // Update sales counters.
    for (const tld of tlds) {
      await incrSold(tld).catch((error: any) => {
        console.error(
          "[register] counter_failed",
          tld,
          String(error?.message ?? error).slice(0, 200)
        );
      });
    }

    // Claims and payment are recorded.
    // Failed mints remain pending for a separate retry process.
    const items: {
      domain: string;
      tld: string;
      asset?: string;
      mint_tx?: string;
      pending_mint: boolean;
    }[] = [];

    for (const tld of tlds) {
      let mint: {
        asset: string;
        signature: string;
      } | null = null;

      try {
        mint = await mintTeosAsset(
          quote.domain,
          publicKey,
          tld
        );

        if (mint) {
          await recordMint(
            fullName(quote.domain, tld),
            mint
          );
        }
      } catch (error: any) {
        console.error(
          "[register] mint_failed",
          JSON.stringify({
            domain: quote.domain,
            tld,
            owner: publicKey,
            payment_tx,
            error: String(
              error?.message ?? error
            ).slice(0, 300),
          })
        );
      }

      if (!mint) {
        await logPendingMint(
          quote.domain,
          tld,
          publicKey,
          payment_tx
        ).catch((error: any) => {
          console.error(
            "[register] pending_mint_log_failed",
            JSON.stringify({
              domain: quote.domain,
              tld,
              error: String(
                error?.message ?? error
              ).slice(0, 200),
            })
          );
        });
      }

      items.push({
        domain: `${quote.domain}.${tld}`,
        tld,
        ...(mint
          ? {
              asset: mint.asset,
              mint_tx: mint.signature,
            }
          : {}),
        pending_mint: !mint,
      });
    }

    const first = items[0];

    return NextResponse.json({
      success: true,
      pending_mint: items.some(
        (item) => item.pending_mint
      ),
      domain: first.domain,
      owner: publicKey,
      payment_tx,
      quote_id: quote.id,
      items,
      ...(first.asset
        ? {
            asset: first.asset,
            mint_tx: first.mint_tx,
          }
        : {}),
    });
  } catch (error: any) {
    console.error(
      "[register] request_failed",
      String(error?.message ?? error).slice(0, 300)
    );

    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}
