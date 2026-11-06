import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { env } from "@/lib/env";

// GET /api/owns-teos?wallet=<base58>  ->  { owns: boolean, names: string[] }  (names = the wallet's .teos names without the suffix)
// True when the wallet holds a .teos asset (Metaplex Core, from the TEOS collection when COLLECTION_ADDRESS is set).
// Used only to decide whether the site shows country prices; registering a country name is still enforced in /api/register.
export const dynamic = "force-dynamic";

const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function rpc(): string | null {
  const explicit = env("MINT_RPC_URL");
  if (explicit) return explicit;
  const key = env("HELIUS_API_KEY");
  return key ? `https://mainnet.helius-rpc.com/?api-key=${key}` : null;
}

export async function GET(req: NextRequest) {
  const rl = await checkRateLimit("owns-teos", 30, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  const wallet = req.nextUrl.searchParams.get("wallet") || "";
  if (!B58.test(wallet)) return NextResponse.json({ owns: false, error: "invalid_wallet" }, { status: 400 });
  const url = rpc();
  if (!url) return NextResponse.json({ owns: false, names: [] });
  try {
    const collection = env("COLLECTION_ADDRESS");
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "owns-teos", method: "getAssetsByOwner", params: { ownerAddress: wallet, page: 1, limit: 1000 } }),
      signal: AbortSignal.timeout(6000),
    });
    const json: any = await res.json();
    const items: any[] = json?.result?.items ?? [];
    const names = items
      .filter((a) => {
        const name = String(a?.content?.metadata?.name ?? "").toLowerCase();
        if (!name.endsWith(".teos")) return false;
        if (!collection) return true;
        return (a?.grouping ?? []).some((g: any) => g.group_key === "collection" && g.group_value === collection);
      })
      .map((a) => String(a.content.metadata.name).toLowerCase().replace(/\.teos$/, ""));
    return NextResponse.json({ owns: names.length > 0, names }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ owns: false });
  }
}
