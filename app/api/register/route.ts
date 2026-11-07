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
import { fullName, isSaleTld } from "../../../lib/tlds";
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


async function ownsTeosOnChain(wallet: string, domain: string): Promise<boolean | null> {
  const explicit = env("MINT_RPC_URL") || env("HELIUS_RPC_URL");
  const key = env("HELIUS_API_KEY");
  const url = explicit || (key ? `https://mainnet.helius-rpc.com/?api-key=${key}` : null);
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "owns-teos-check", method: "getAssetsByOwner", params: { ownerAddress: wallet, page: 1, limit: 1000 } }),
      signal: AbortSignal.timeout(6000),
    });
    const json: any = await res.json();
    const items: any[] = json?.result?.items ?? [];
    const collection = env("COLLECTION_ADDRESS");
    const want = `${domain.toLowerCase()}.teos`;
    return items.some((a: any) => {
      const name = String(a?.content?.metadata?.name ?? "").toLowerCase();
      if (name !== want) return false;
      if (!collection) return true;
      return (a?.grouping ?? []).some((g: any) => g.group_key === "collection" && g.group_value === collection);
    });
  } catch { return null; }
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

    // Older quotes may carry other TLDs: never register or mint them while sales are teos-only.
    const blockedTld = tlds.find((t) => !isSaleTld(t));
    if (blockedTld) {
      return NextResponse.json(
        { error: "registration_closed", message: "TLD blocked", tld: blockedTld },
        { status: 503 }
      );
    }

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

    // Other TLDs (e.g. .eg) require the matching .teos identity
    // to be owned ON-CHAIN right now - not just in the old registry.
    // This stops the original owner from claiming .eg after selling .teos.
    if (!tlds.includes("teos")) {
      const ownsOnChain = await ownsTeosOnChain(publicKey, quote.domain);
      if (ownsOnChain === null) {
        return NextResponse.json({ error: "teos_check_unavailable" }, { status: 503 });
      }
      if (!ownsOnChain) {
        return NextResponse.json(
          { error: "teos_required", message: "Register the .teos name first." },
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

    // Consume quote atomically BEFORE minting
    if (!(await markUsed(quote_id))) {
      // No domains claimed yet at this point - only payment_tx was claimed, it expires in 24h
      return NextResponse.json(
        { error: "invalid_quote", reason: "already_used" },
        { status: 401 }
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

    // markUsed already done atomically after claimTx

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

