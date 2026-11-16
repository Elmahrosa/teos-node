import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "../../../../lib/rate-limit";
import { getClaim } from "../../../../lib/registry";
import { ownsTeosOnChain } from "../../../../lib/ownership";

export const dynamic = "force-dynamic";

// GET /api/wallet/resolve?name=<name> -> { name, wallet }
// Resolves <name>.teos to the wallet that holds it *right now*: the registry names a candidate owner and
// the on-chain check confirms it. A stale registry entry is refused instead of sending funds to a former owner.
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit("wallet-resolve", 30, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  const name = (req.nextUrl.searchParams.get("name") || "").trim().toLowerCase().replace(/\.teos$/, "");
  if (!/^[a-z0-9-]{1,30}$/.test(name)) return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  const claim = await getClaim(name).catch(() => null);
  if (!claim) return NextResponse.json({ error: "no_name" }, { status: 404 });
  const owns = await ownsTeosOnChain(claim.owner, name).catch(() => null);
  if (owns === null) return NextResponse.json({ error: "ownership_check_unavailable" }, { status: 503 });
  if (!owns) return NextResponse.json({ error: "owner_changed" }, { status: 409 });
  return NextResponse.json({ name, wallet: claim.owner }, { headers: { "cache-control": "no-store" } });
}
