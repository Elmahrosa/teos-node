import { NextResponse } from "next/server";
import { isSealedDomain } from "../../../lib/sealed";
import { clientIp, rateLimit, store, verifyTransaction, solToLamports, getCharterState, getTier } from "../../../lib/teos";

async function handle(req: Request) {
  if (!(await rateLimit(`reg:${clientIp(req)}`, 10, 60))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const signature: string | undefined = body.signature;
  const quoteId: string | undefined = body.quote_id;
  if (!signature || !quoteId) return NextResponse.json({ error: "missing_signature_or_quote" }, { status: 400 });
  const quote = await store.getQuote(quoteId);
  if (!quote) return NextResponse.json({ error: "invalid_quote" }, { status: 401 });
  if (isSealedDomain(quote.domain)) return NextResponse.json({ error: "domain_reserved_sealed" }, { status: 403 });
  if (new Date(quote.expires_at).getTime() < Date.now()) return NextResponse.json({ error: "quote_expired" }, { status: 410 });
  if (await store.isSignatureUsed(signature)) return NextResponse.json({ error: "signature_reused" }, { status: 409 });
  const expectedLamports = solToLamports(quote.price_usd, quote.sol_price_reference);
  const verify = await verifyTransaction(signature, { domain: quote.domain, price_usd: quote.price_usd, quote_id: quoteId, expectedLamports });
  if (!verify.ok) {
    await store.log({ event: "verification_failed", reason: verify.reason, quote_id: quoteId, signature, domain: quote.domain, refund_candidate: true });
    return NextResponse.json({ error: "verification_failed", reason: verify.reason, refund: "auto-refund within 24h minus network fee" }, { status: 422 });
  }
  const charterState = await getCharterState();
  const tier = getTier(quote.domain);
  const isCharter = quote.price_usd === tier.charter && charterState.charter_active;
  const registration = {
    domain: `${quote.domain}.teos`,
    tier: quote.tier,
    charter: isCharter,
    price_usd: quote.price_usd,
    wallet: verify.from,
    signature,
    sol_amount: expectedLamports / 1e9,
    sol_price_reference: quote.sol_price_reference,
    seal_url: null,
    quote_id: quoteId,
    timestamp: new Date().toISOString(),
    status: "verified",
  };
  try {
    await store.addRegistration(quote.domain, registration);
  } catch {
    await store.log({ event: "verification_passed_but_taken", quote_id: quoteId, signature, domain: quote.domain, refund_candidate: true });
    return NextResponse.json({ error: "Domain already registered", refund: "auto-refund within 24h minus network fee" }, { status: 409 });
  }
  await store.markSignatureUsed(signature);
  await store.incrStat("spots_sold", 1);
  await store.incrStat("total_raised_usd", registration.price_usd);
  await store.log({ event: "verification_passed", domain: registration.domain, signature, quote_id: quoteId });
  await store.deleteQuote(quoteId);
  return NextResponse.json({ ...registration, status: "registered" }, { status: 201 });
}

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
