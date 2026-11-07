import { NextRequest, NextResponse } from "next/server";
import reservedData from "../../../domains/reserved-list.json";
import { isSealedDomain } from "../../../lib/sealed";
import { isClaimed } from "../../../lib/registry";
import { getPriceOrNull } from "../../../lib/pricing";
import { fullName, getTld, isSaleTld } from "../../../lib/tlds";
import { parseDomain, isReservedWord, isNotForSaleDomain } from "../../../lib/domain-rules";
import { checkRateLimit, rateLimitResponse } from "../../../lib/rate-limit";

function isReserved(domainUpper: string): boolean {
  const data: any = reservedData;
  if (data[domainUpper]) return true;
  if (data.owner && String(data.owner).toUpperCase() === domainUpper) return true;
  const lists = [...(data.premium_global || []), ...(data.brothers || []), ...(data.sisters || []), ...(data.premium_eg || [])];
  return lists.some((d: string) => String(d).toUpperCase() === domainUpper);
}

// GET /api/availability?name=ahmed&tld=eg  -> is exactly ahmed.eg available?
// "domain" is accepted as an alias of "name", "ahmed.eg" as name works too, and the tld defaults to teos.
// Public answers carry no owner, tier or note, and every kind of "not for sale" looks the same,
// so this endpoint cannot be used to map the reserved list.
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit("availability", 60, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  try {
    const q = req.nextUrl.searchParams;
    let rawName = q.get("name") ?? q.get("domain");
    let rawTld = (q.get("tld") ?? "").trim().toLowerCase().replace(/^\./, "");
    // "ahmed.eg": split off a known TLD suffix when no tld was given.
    if (typeof rawName === "string" && rawName.includes(".")) {
      const i = rawName.lastIndexOf(".");
      const suffix = rawName.slice(i + 1).trim().toLowerCase();
      if (getTld(suffix) && (!rawTld || rawTld === suffix)) { rawTld = suffix; rawName = rawName.slice(0, i); }
    }
    const tld = rawTld || "teos";
    const parsed = parseDomain(rawName);
    if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
    const domain = parsed.domain;
    const def = getTld(tld);
    if (!def || !def.live) return NextResponse.json({ error: "invalid_tld" }, { status: 400 });
    const upper = domain.toUpperCase();
    // Founder rule: ayman.<any tld> is never available. Reserved and sealed names are blocked on every TLD.
    if (isNotForSaleDomain(domain) || isReservedWord(domain) || isReserved(upper) || isSealedDomain(upper)) {
      return NextResponse.json({ available: false, reason: "reserved", domain, tld });
    }
    if (!isSaleTld(tld)) return NextResponse.json({ available: false, reason: "reserved", domain, tld });
    if (await isClaimed(fullName(domain, tld))) return NextResponse.json({ available: false, reason: "taken", domain, tld });
    const price = getPriceOrNull(domain, tld);
    if (price === null) return NextResponse.json({ available: false, reason: "price_unavailable", domain, tld });
    return NextResponse.json({ available: true, reason: null, domain, tld, price_usd: price });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
