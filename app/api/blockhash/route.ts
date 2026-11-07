import { NextResponse } from "next/server";
import { env } from "../../../lib/env";
import { checkRateLimit, rateLimitResponse } from "../../../lib/rate-limit";

// Short cache: a blockhash stays valid for ~60-90s, so sharing one for a few seconds is safe and saves paid RPC calls.
let cached: { at: number; body: { blockhash: string; lastValidBlockHeight: number } } | null = null;
const TTL_MS = 4000;

// Latest blockhash for the browser to build the payment transfer. Same RPC the server uses to verify it.
export async function GET() {
  const rl = await checkRateLimit("blockhash", 40, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  if (cached && Date.now() - cached.at < TTL_MS) return NextResponse.json(cached.body);
  const url = env("HELIUS_RPC_URL") ?? (env("HELIUS_API_KEY") ? `https://mainnet.helius-rpc.com/?api-key=${env("HELIUS_API_KEY")}` : "https://api.mainnet-beta.solana.com");
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestBlockhash", params: [{ commitment: "confirmed" }] }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const j: any = await r.json();
    const v = j?.result?.value;
    if (!v?.blockhash) return NextResponse.json({ error: "rpc_unavailable" }, { status: 503 });
    const body = { blockhash: v.blockhash as string, lastValidBlockHeight: v.lastValidBlockHeight as number };
    cached = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "rpc_unavailable" }, { status: 503 });
  }
}