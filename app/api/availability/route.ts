import { NextRequest, NextResponse } from "next/server";
import reservedData from "../../../domains/reserved-list.json";
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
  const domainParam = req.nextUrl.searchParams.get("domain") || "";
  const domain = domainParam.trim();
  if (!domain) {
    return NextResponse.json({error: "domain required"}, {status: 400});
  }
  const domainUpper = domain.toUpperCase();
  const check = isReserved(domainUpper);

  if (check.reserved) {
    return NextResponse.json({
      available: false,
      reason: "RESERVED",
      domain: domainUpper,
      tier: check.entry.tier || "FOUNDERS",
      owner: check.entry.owner || "ELMAHROSA FAMILY",
      sealed: true,
      status: "RESERVED_SEALED",
      note: check.entry.note || "FAMILY SEALED 9 ONLY ZEBA DELETED"
    });
  }

  return NextResponse.json({
    available: true,
    reason: null,
    domain: domainUpper,
    tier: "STANDARD",
    price_usd: 5,
    status: "AVAILABLE"
  });
}
