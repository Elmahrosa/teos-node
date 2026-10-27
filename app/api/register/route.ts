import { NextResponse } from "next/server";
import { parseDomain } from "../../../lib/domain-rules";
import { getQuote, markUsed } from "../../../lib/quoteStore";
import { verifyWalletSignature } from "../../../lib/sig";
import { isClaimed, claimDomain, claimTx, releaseTx, registryPersistent } from "../../../lib/registry";
import { verifyPayment } from "../../../lib/payment";
import { mintTeosAsset } from "../../../lib/teos";

const bad = (reason: string) => NextResponse.json({ error: "invalid_quote", reason }, { status: 401 });

export async function POST(req: Request) {
  // Closed until on-chain payment verification ships. Set REGISTRATION_OPEN=true to enable.
  if (process.env.REGISTRATION_OPEN !== "true") {
    return NextResponse.json({ error: "registration_closed" }, { status: 503, headers: { "Retry-After": "3600" } });
  }
  const treasury = process.env.TREASURY_WALLET;
  const prodNeedsRedis = process.env.NODE_ENV === "production" && !registryPersistent && process.env.ALLOW_MEMORY_REGISTRY !== "true";
  if (!treasury || (!process.env.HELIUS_API_KEY && !process.env.HELIUS_RPC_URL) || prodNeedsRedis) {
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
    await mintTeosAsset(quote.domain, publicKey); // stub until #5
    return NextResponse.json({
      success: true,
      pending_mint: true,
      domain: `${quote.domain}.teos`,
      owner: publicKey,
      payment_tx,
      quote_id: quote.id,
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
