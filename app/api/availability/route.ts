import { NextRequest, NextResponse } from "next/server";
import reservedData from "../../../domains/reserved-list.json";
import { isSealedDomain } from "../../../lib/sealed";
import { isClaimed } from "../../../lib/registry";
import { getPrice } from "../../../lib/pricing";
import { parseDomain, isReservedWord, isNotForSaleDomain } from "../../../lib/domain-rules";
import { checkRateLimit, rateLimitResponse } from "../../../lib/rate-limit";

function isReserved(domainUpper: string): boolean {
  const data: any = reservedData;
  if (data[domainUpper]) return true;
  if (data.owner && String(data.owner).toUpperCase() === domainUpper) return true;
  const lists = [...(data.premium_global || []), ...(data.brothers || []), ...(data.sisters || []), ...(data.premium_eg || [])];
  return lists.some((d: string) => String(d).toUpperCase() === domainUpper);
}

// Public answers carry no owner, tier or note, and every kind of "not for sale" looks the same,
// so this endpoint cannot be used to map the reserved list.
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit("availability", 60, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  try {
    const parsed = parseDomain(req.nextUrl.searchParams.get("domain"));
    if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
    const domain = parsed.domain;
    const upper = domain.toUpperCase();
    if (isNotForSaleDomain(domain) || isReservedWord(domain) || isReserved(upper) || isSealedDomain(upper)) {
      return NextResponse.json({ available: false, reason: "reserved", domain });
    }
    if (await isClaimed(domain)) return NextResponse.json({ available: false, reason: "taken", domain });
    return NextResponse.json({ available: true, reason: null, domain, price_usd: getPrice(domain, "teos") });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}