import { NextResponse } from "next/server";
import { clientIp, rateLimit, sanitizeDomain, validateDomain, store, getCurrentPriceUsd, getSolPrice, getCharterState, signQuote } from "../../../lib/teos";
export async function POST(req: Request) {
  if (!(await rateLimit(`quote:${clientIp(req)}`, 60, 60))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const domain = sanitizeDomain(body.domain);
  if (!domain) return NextResponse.json({ error: "invalid_domain" }, { status: 400 });
  const check = validateDomain(domain);
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });
  if (!(await store.isDomainAvailable(domain))) return NextResponse.json({ error: "domain_taken" }, { status: 409 });
  const oracle = await getSolPrice();
  if (!oracle) return NextResponse.json({ error: "oracle_unavailable" }, { status: 503 });
  const { tier, price_usd, charter } = await getCurrentPriceUsd(domain);
  const sol_amount = price_usd / oracle.usd;
  const quote = { quote_id: crypto.randomUUID(), domain, tier: tier.name, price_usd, sol_amount, sol_price_reference: oracle.usd, expires_at: new Date(Date.now() + 300_000).toISOString() };
  const signature = await signQuote(quote as any);
  await store.saveQuote({ ...quote, signature });
  const charterState = await getCharterState();
  return NextResponse.json({ ...quote, signature, charter: { ...charterState, applied: charter } });
}
