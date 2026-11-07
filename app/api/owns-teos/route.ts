import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { assetsOf, ourTeosNames } from "@/lib/ownership";

// GET /api/owns-teos?wallet=<base58>  ->  { owns: boolean, names: string[] }  (names = the wallet's .teos names without the suffix)
// True when the wallet holds a .teos asset (Metaplex Core asset that is ours: recorded in the registry or updated by our authority; no collection is involved).
// Used only to decide whether the site shows country prices; registering a country name is still enforced in /api/register.
export const dynamic = "force-dynamic";

const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function GET(req: NextRequest) {
  const rl = await checkRateLimit("owns-teos", 30, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  const wallet = req.nextUrl.searchParams.get("wallet") || "";
  if (!B58.test(wallet)) return NextResponse.json({ owns: false, error: "invalid_wallet" }, { status: 400 });
  try {
    const items = await assetsOf(wallet);
    if (items === null) return NextResponse.json({ owns: false });
    const names = await ourTeosNames(items);
    return NextResponse.json({ owns: names.length > 0, names }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ owns: false });
  }
}
