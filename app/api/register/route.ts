import { NextResponse } from "next/server";
import { parseDomain } from "../../../lib/domain-rules";
import { getQuote, markUsed } from "../../../lib/quoteStore";
import { verifyWalletSignature } from "../../../lib/sig";
import { isClaimed, claimDomain, recordMint, incrSold, claimTx, releaseTx, registryPersistent } from "../../../lib/registry";
import { env } from "../../../lib/env";
import { verifyPayment } from "../../../lib/payment";
import { mintTeosAsset } from "../../../lib/mint";

const bad = (reason: string) => NextResponse.json({ error: "invalid_quote", reason }, { status: 401 });

export async function POST(req: Request) {
  // Closed until on-chain payment verification ships. Set REGISTRATION_OPEN=true to enable.
  if (!["REGISTRATION_OPEN", "REGISTRATION_ENABLED"].some((k) => env(k) === "true")) {
    return NextResponse.json({ error: "registration_closed" }, { status: 503, headers: { "Retry-After": "3600" } });
  }
  const treasury = env("TREASURY_WALLET");
  const hasHelius = !!(env("HELIUS_API_KEY") || env("HELIUS_RPC_URL"));
  const storageOk = registryPersistent || process.env.NODE_ENV !== "production" || env("ALLOW_MEMORY_REGISTRY") === "true";
  if (!treasury || !hasHelius || !storageOk) {
    // Names only, never values.
    console.error(`[register] not_configured: TREASURY_WALLET=${!!treasury} HELIUS=${hasHelius} UPSTASH_URL=${!!env("UPSTASH_REDIS_REST_URL")} UPSTASH_TOKEN=${!!env("UPSTASH_REDIS_REST_TOKEN")} persistent_registry=${registryPersistent}`);
    return NextResponse.json({ error: "registration_closed", reason: "not_configured" }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { quote_id, signature, publicKey, payment_tx } = body ?? {};
    const parsed = parseDomain(body?.domain);
    if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
    if ([quote_id, signature, publicKey, payment_tx].some((v) => typeof v !== "string" || !v)) {
      return NextResponse.json({ error: "missing_signature_or_quote" }, { status: 400 });
    }

    const quote = await getQuote(quote_id);
    if (!quote) return bad("not_found_or_expired");
    if (quote.used) return bad("already_used");
    if (quote.domain !== parsed.domain) return bad("domain_mismatch");
    if (Date.now() > quote.expiresAt) return bad("expired");

    if (!(await verifyWalletSignature(quote.message, signature, publicKey))) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }

    if (await isClaimed(quote.domain)) return NextResponse.json({ error: "already_minted" }, { status: 401 });

    const pay = await verifyPayment({ txSignature: payment_tx, payer: publicKey, treasury, minLamports: quote.priceLamports });
    if (!pay.ok) {
      // Public data only (signature, addresses, amounts). No secrets.
      console.error("[register] payment_not_verified", JSON.stringify({ reason: pay.reason, payment_tx, payer: publicKey, treasury, domain: quote.domain, detail: pay.detail }));
      const status = pay.reason === "rpc_unavailable" ? 503 : 402;
      return NextResponse.json({ error: "payment_not_verified", reason: pay.reason }, { status });
    }

    // Consume the payment first, then the name. If the name was taken meanwhile, free the payment so it can be reused.
    if (!(await claimTx(payment_tx, quote.domain))) return NextResponse.json({ error: "payment_already_used" }, { status: 409 });
    if (!(await claimDomain(quote.domain, publicKey, payment_tx))) {
      await releaseTx(payment_tx);
      return NextResponse.json({ error: "already_minted" }, { status: 409 });
    }
    await markUsed(quote.id);
    await incrSold().catch((e) => console.error("[register] counter_failed", String(e?.message ?? e).slice(0, 200)));
    // The claim and payment are already recorded. If minting fails, the registration stays pending and is logged for a retry.
    let mint: { asset: string; signature: string } | null = null;
    try {
      mint = await mintTeosAsset(quote.domain, publicKey);
      if (mint) await recordMint(quote.domain, mint);
    } catch (e: any) {
      console.error("[register] mint_failed", JSON.stringify({ domain: quote.domain, owner: publicKey, payment_tx, error: String(e?.message ?? e).slice(0, 300) }));
    }
    return NextResponse.json({
      success: true,
      pending_mint: !mint,
      domain: `${quote.domain}.teos`,
      owner: publicKey,
      payment_tx,
      quote_id: quote.id,
      ...(mint ? { asset: mint.asset, mint_tx: mint.signature } : {}),
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
