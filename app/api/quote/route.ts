import { NextResponse } from "next/server";
import { clientIp, rateLimit, sanitizeDomain, validateDomain, store, getCurrentPriceUsd, getSolPrice, getCharterState, signQuote } from "../../../lib/teos";
import { isSealedDomain } from "../../../lib/sealed";
import { parseDomain, isReservedWord } from "../../../lib/domain-rules";
import reservedData from "../../../domains/reserved-list.json";

function isFamilySealed(domainUpper: string): boolean {
  const d = reservedData as any;
  const all = [
    ...(d.premium_global || []),
    ...(d.brothers || []),
    ...(d.sisters || []),
    ...(d.premium_eg || []),
    d.owner || ""
  ].map((x: string) => x.toUpperCase().replace(".TEOS","").trim());
  
  const check = domainUpper.toUpperCase().replace(".TEOS","").trim();
  return all.includes(check) || all.includes(`${check}.TEOS`);
}

export async function POST(req: Request) {
  if (!(await rateLimit(`quote:${clientIp(req)}`, 60, 60))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const parsed = parseDomain(body.domain);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  if (isReservedWord(parsed.domain)) return NextResponse.json({ available: false, reason: "reserved", domain: parsed.domain });
  const domain = sanitizeDomain(parsed.domain);

  // --- FAMILY SEALED CHECK - MUST BE FIRST ---
  if (isFamilySealed(domain) || isSealedDomain(domain)) {
    return NextResponse.json({ 
      error: "domain_reserved_sealed", 
      domain: domain.toUpperCase(),
      available: false,
      sealed: true,
      status: "RESERVED_SEALED",
      owner: "EL-MAHROSA-VAULT",
      price: null,
      message: "🔒 FAMILY - NOT FOR SALE"
    }, { status: 403 });
  }
  // --- END CHECK ---

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
