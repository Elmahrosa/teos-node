import { NextRequest, NextResponse } from "next/server";
import reservedData from "../../../domains/reserved-list.json";
import { isSealedDomain } from "../../../lib/sealed";
import { priceFor } from "../../../lib/pricing";
import { isClaimed } from "../../../lib/registry";
import { isClaimed, getSoldCount } from "../../../lib/registry";
import { priceForName } from "../../../lib/pricing";
import { parseDomain, isReservedWord } from "../../../lib/domain-rules";
import path from "path";
import fs from "fs";

// Try to also load src version if exists
let srcReserved: any = null;
try {
  const srcPath = path.join(process.cwd(), "..", "src", "reserved-list.json");
  if (fs.existsSync(srcPath)) {
    srcReserved = JSON.parse(fs.readFileSync(srcPath, "utf8"));
  }
} catch {}

function isReserved(domainUpper: string): {reserved: boolean, entry: any} {
  // Check 1: MAP format (teos-node)
  const mapEntry = (reservedData as any)[domainUpper];
  if (mapEntry) return {reserved: true, entry: mapEntry};

  // Check 2: ARRAY format (src)
  const data = srcReserved || reservedData;
  const allArrays = [
    ...(data.premium_global || []),
    ...(data.brothers || []),
    ...(data.sisters || []),
    ...(data.premium_eg || [])
  ].map((d: string) => d.toUpperCase());

  // Also check owner field
  if (data.owner && data.owner.toUpperCase() === domainUpper) {
    return {reserved: true, entry: {owner: data.owner, tier: "FOUNDERS"}};
  }

  if (allArrays.includes(domainUpper)) {
    return {reserved: true, entry: {owner: "FAMILY", tier: "FOUNDERS", source: "src/reserved-list.json"}};
  }

  // Check 3: Direct key check in src file if it's array-like object
  if (data[domainUpper]) return {reserved: true, entry: data[domainUpper]};

  return {reserved: false, entry: null};
}

export async function GET(req: NextRequest) {
  try {
    const parsed = parseDomain(req.nextUrl.searchParams.get("domain"));
    if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
    const domain = parsed.domain;
    if (isReservedWord(domain)) {
      return NextResponse.json({ available: false, reason: "reserved", domain });
    }
    if (await isClaimed(domain)) {
      return NextResponse.json({ available: false, reason: "taken", domain });
    }
    const domainUpper = domain.toUpperCase();
    const check = isReserved(domainUpper);
    if (!check.reserved && isSealedDomain(domainUpper)) {
      check.reserved = true;
      check.entry = { owner: "AYMAN.TEOS", tier: "FOUNDERS", note: "SEALED - NOT FOR SALE" };
    }

    if (check.reserved) {
      return NextResponse.json({
        available: false,
        reason: "reserved",
        domain: domainUpper,
        tier: check.entry.tier || "FOUNDERS",
        owner: check.entry.owner || "ELMAHROSA FAMILY",
        sealed: true,
        status: "RESERVED_SEALED",
        note: check.entry.note || "FAMILY SEALED 9 ONLY ZEBA DELETED"
      });
    }

    const price = await priceFor(domain).catch(() => null);
    const price = priceForName(domain, await getSoldCount());
    return NextResponse.json({
      available: true,
      reason: null,
      domain: domainUpper,
      tier: "STANDARD",
      price_usd: price?.isEarlyBird ? 5 : null,
      price_sol: price?.priceSOL ?? null,
      early_bird: price?.isEarlyBird ?? false,
      price_usd: price.usd,
      is_promo: price.isPromo,
      status: "AVAILABLE"
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
