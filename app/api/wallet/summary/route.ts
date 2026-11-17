import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "../../../../lib/rate-limit";
import { assetsOf, ownedNames, solBalanceOf, type OwnedName } from "../../../../lib/ownership";
import { getSite } from "../../../../lib/sites-store";

export const dynamic = "force-dynamic";

const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// Published sites are stored under the bare name for .teos (the only namespace publishing supports today).
async function isPublished(n: OwnedName): Promise<boolean> {
  const keys = n.tld === "teos" ? [n.label, n.name] : [n.name];
  for (const key of keys) {
    try {
      if (await getSite(key)) return true;
    } catch {
      return false;
    }
  }
  return false;
}

// GET /api/wallet/summary?wallet=<base58>
// -> { wallet, names: [{ name, label, tld, verified, published }], balanceSol }
// names = every name the wallet holds in any known namespace (on-chain, verified or not).
// published comes from the site store; it is never used to hide a name. balanceSol is null when the RPC
// cannot answer, so the UI shows "unavailable" instead of a fake 0.
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit("wallet-summary", 30, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  const wallet = req.nextUrl.searchParams.get("wallet") || "";
  if (!B58.test(wallet)) return NextResponse.json({ error: "invalid_wallet" }, { status: 400 });
  const items = await assetsOf(wallet).catch(() => null);
  if (items === null) return NextResponse.json({ error: "rpc_unavailable" }, { status: 503 });
  let owned: OwnedName[];
  try {
    owned = await ownedNames(items);
  } catch {
    // A compromised authority or a failed ownership computation must not look like "no names".
    return NextResponse.json({ error: "ownership_unavailable" }, { status: 503 });
  }
  const [names, balanceSol] = await Promise.all([
    Promise.all(owned.map(async (n) => ({ ...n, published: await isPublished(n) }))),
    solBalanceOf(wallet).catch(() => null),
  ]);
  return NextResponse.json({ wallet, names, balanceSol }, { headers: { "cache-control": "no-store" } });
}
