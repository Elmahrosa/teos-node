import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "../../../../lib/rate-limit";
import { assetsOf, ourTeosNames, solBalanceOf } from "../../../../lib/ownership";

export const dynamic = "force-dynamic";

const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// GET /api/wallet/summary?wallet=<base58> -> { wallet, names, balanceSol }
// names = the .teos names the wallet holds on-chain (verified, not from the registry).
// balanceSol is null when the RPC cannot answer, so the UI shows "unavailable" instead of a fake 0.
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit("wallet-summary", 30, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  const wallet = req.nextUrl.searchParams.get("wallet") || "";
  if (!B58.test(wallet)) return NextResponse.json({ error: "invalid_wallet" }, { status: 400 });
  const items = await assetsOf(wallet).catch(() => null);
  if (items === null) return NextResponse.json({ error: "rpc_unavailable" }, { status: 503 });
  const [names, balanceSol] = await Promise.all([
    ourTeosNames(items).catch(() => [] as string[]),
    solBalanceOf(wallet).catch(() => null),
  ]);
  return NextResponse.json({ wallet, names, balanceSol }, { headers: { "cache-control": "no-store" } });
}
