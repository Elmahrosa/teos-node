import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifySession } from "../../../../lib/founderAuth";
import { checkRateLimit, rateLimitResponse } from "../../../../lib/rate-limit";
import { getAssetsByOwner, getSolBalance } from "../../../../lib/das";

// GET /api/founder/mint - the Mint Wallet's SOL balance + NFTs / cNFTs.
// Read-only and display-only: this wallet is NOT a founder identity and is never used for auth.
// The route verifies the founder session cookie because /api/ is outside middleware.ts.
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  if (!verifySession((await headers()).get("cookie"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  }

  const rl = await checkRateLimit("founder-mint", 30, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);

  const wallet = process.env.NEXT_PUBLIC_MINT_WALLET?.trim() ?? "";
  if (!wallet) {
    return NextResponse.json(
      { wallet: "", balanceSol: null, total: 0, items: [], error: "mint_wallet_not_configured" },
      { headers: noStore }
    );
  }

  const key = process.env.HELIUS_API_KEY?.trim() ?? "";
  if (!key) {
    return NextResponse.json(
      { wallet, balanceSol: null, total: 0, items: [], error: "helius_not_configured" },
      { headers: noStore }
    );
  }

  // Balance and assets fail independently: an empty mint wallet is a normal state, not an error.
  const [assets, balance] = await Promise.allSettled([getAssetsByOwner(wallet, key), getSolBalance(wallet, key)]);
  const items = assets.status === "fulfilled" ? assets.value : [];
  const balanceSol = balance.status === "fulfilled" ? balance.value : null;
  const failed = assets.status === "rejected" || balance.status === "rejected";

  return NextResponse.json(
    { wallet, balanceSol, total: items.length, items, ...(failed ? { error: "helius_unavailable" } : {}) },
    { headers: noStore }
  );
}
