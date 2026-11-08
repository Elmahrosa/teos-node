import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifySession } from "../../../../lib/founderAuth";
import { checkRateLimit, rateLimitResponse } from "../../../../lib/rate-limit";

// GET /api/founder/nfts - the founder wallet's NFTs / cNFTs (Metaplex DAS via Helius).
// This route lives under /api/, which middleware.ts excludes from the password gate,
// so it verifies the same founder session cookie itself.
export const dynamic = "force-dynamic";

type NftItem = {
  id: string;
  name: string;
  image: string;
  collection: string;
  compressed: boolean;
  interface: string;
};

const noStore = { "Cache-Control": "no-store" };
const HELIUS_TIMEOUT_MS = 10_000;

function mapAsset(a: any): NftItem {
  const meta = a?.content?.metadata ?? {};
  const image = a?.content?.links?.image || a?.content?.files?.[0]?.uri || "";
  const grouping = Array.isArray(a?.grouping) ? a.grouping : [];
  const collection = grouping.find((g: any) => g?.group_key === "collection")?.group_value ?? "";
  return {
    id: String(a?.id ?? ""),
    name: String(meta?.name ?? ""),
    image: String(image ?? ""),
    collection: String(collection ?? ""),
    compressed: Boolean(a?.compression?.compressed),
    interface: String(a?.interface ?? ""),
  };
}

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
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "founder-nfts",
        method: "getAssetsByOwner",
        params: { ownerAddress: wallet, page: 1, limit: 1000 },
      }),
      signal: AbortSignal.timeout(HELIUS_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`helius_http_${res.status}`);
    const json: any = await res.json();
    if (json?.error) throw new Error("helius_rpc_error");
    const raw = Array.isArray(json?.result?.items) ? json.result.items : [];
    const items = raw.map(mapAsset);
    return NextResponse.json({ wallet, total: items.length, items }, { headers: noStore });
  } catch {
    // Never leak the upstream error (or the API key) to the client; the page renders an empty state.
    return NextResponse.json(
      { wallet, total: 0, items: [], error: "helius_unavailable" },
      { headers: noStore }
    );
  }
}
