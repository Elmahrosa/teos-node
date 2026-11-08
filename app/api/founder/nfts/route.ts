import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifySession } from "../../../../lib/founderAuth";
import { checkRateLimit, rateLimitResponse } from "../../../../lib/rate-limit";
import { getAssetsByOwner } from "../../../../lib/das";

// GET /api/founder/nfts - the Founder Vault wallet's NFTs / cNFTs (Metaplex DAS via Helius).
// This route lives under /api/, which middleware.ts excludes from the password gate,
// so it verifies the same founder session cookie itself.
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  if (!verifySession((await headers()).get("cookie"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  }

  const rl = await checkRateLimit("founder-nfts", 30, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);

  const wallet = process.env.NEXT_PUBLIC_FOUNDER_WALLET?.trim() ?? "";
  if (!wallet) {
    return NextResponse.json(
      { wallet: "", total: 0, items: [], error: "founder_wallet_not_configured" },
      { headers: noStore }
    );
  }

  const key = process.env.HELIUS_API_KEY?.trim() ?? "";
  if (!key) {
    return NextResponse.json(
      { wallet, total: 0, items: [], error: "helius_not_configured" },
      { headers: noStore }
    );
  }

  try {
    const items = await getAssetsByOwner(wallet, key);
    return NextResponse.json({ wallet, total: items.length, items }, { headers: noStore });
  } catch {
    // Never leak the upstream error (or the API key) to the client; the page renders an empty state.
    return NextResponse.json(
      { wallet, total: 0, items: [], error: "helius_unavailable" },
      { headers: noStore }
    );
  }
}
