import { NextResponse } from "next/server";
import { env } from "../../../lib/env";

// Latest blockhash for the browser to build the payment transfer. Same RPC the server uses to verify it.
export async function GET() {
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
    return NextResponse.json({ blockhash: v.blockhash, lastValidBlockHeight: v.lastValidBlockHeight });
  } catch {
    return NextResponse.json({ error: "rpc_unavailable" }, { status: 503 });
  }
}
