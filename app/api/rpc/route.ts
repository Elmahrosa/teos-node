import { NextResponse } from "next/server";
import { Transaction } from "@solana/web3.js";
import { env } from "../../../lib/env";
import { checkRateLimit, rateLimitResponse } from "../../../lib/rate-limit";

export const dynamic = "force-dynamic";

// Same-origin JSON-RPC proxy for the browser wallet flow. The public api.mainnet-beta.solana.com endpoint
// answers 403 to many browsers/IPs, which broke sendTransaction after the wallet had signed. This forwards
// a small allowlist of methods to the Helius RPC the server already uses (key stays server-side).
const ALLOWED = new Set([
  "getLatestBlockhash", "getBlockHeight", "isBlockhashValid", "getSignatureStatuses", "getSignatureStatus",
  "sendTransaction", "simulateTransaction", "getBalance", "getAccountInfo", "getFeeForMessage",
  "getMinimumBalanceForRentExemption", "getSlot", "getVersion",
]);

function upstream(): string {
  const explicit = env("HELIUS_RPC_URL");
  if (explicit) return explicit;
  const key = env("HELIUS_API_KEY");
  return key ? `https://mainnet.helius-rpc.com/?api-key=${key}` : "https://api.mainnet-beta.solana.com";
}

// Log what the wallet is about to broadcast: fee payer, blockhash, every instruction and its accounts.
function describeTx(encoded: unknown, encoding: unknown) {
  try {
    const raw = encoding === "base58" ? null : Buffer.from(String(encoded), "base64");
    if (!raw) return { encoding: "base58", note: "not decoded" };
    const tx = Transaction.from(raw);
    return {
      feePayer: tx.feePayer?.toBase58(),
      blockhash: tx.recentBlockhash,
      signed: tx.signatures.filter((s) => s.signature).length,
      instructions: tx.instructions.map((ix) => ({
        program: ix.programId.toBase58(),
        accounts: ix.keys.map((k) => `${k.pubkey.toBase58()}${k.isSigner ? ":s" : ""}${k.isWritable ? ":w" : ""}`),
        dataLen: ix.data.length,
      })),
    };
  } catch (e: any) {
    return { decode_error: String(e?.message ?? e).slice(0, 120) };
  }
}

export async function POST(req: Request) {
  const rl = await checkRateLimit("rpc", 120, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  const body: any = await req.json().catch(() => null);
  const calls: any[] = Array.isArray(body) ? body : body ? [body] : [];
  if (!calls.length || calls.length > 5 || calls.some((c) => !c || !ALLOWED.has(c.method))) {
    return NextResponse.json({ error: "method_not_allowed" }, { status: 403 });
  }
  for (const c of calls) {
    if (c.method === "sendTransaction" || c.method === "simulateTransaction") {
      console.log("[rpc] tx", c.method, JSON.stringify({ opts: c.params?.[1], tx: describeTx(c.params?.[0], c.params?.[1]?.encoding) }));
    }
  }
  try {
    const r = await fetch(upstream(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const text = await r.text();
    for (const c of calls) {
      if (c.method !== "sendTransaction" && c.method !== "simulateTransaction") continue;
      let j: any = null;
      try { j = JSON.parse(text); } catch {}
      const one = Array.isArray(j) ? j.find((x: any) => x.id === c.id) : j;
      if (one?.error || one?.result?.value?.err) {
        console.error("[rpc] tx_error", c.method, JSON.stringify({ error: one.error ?? one.result.value.err, logs: one?.result?.value?.logs?.slice(-6) }).slice(0, 800));
      } else if (c.method === "sendTransaction") {
        console.log("[rpc] tx_sent", String(one?.result ?? "").slice(0, 100));
      }
    }
    return new NextResponse(text, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("[rpc] upstream_failed", String(e?.message ?? e).slice(0, 200));
    return NextResponse.json({ error: "rpc_unavailable" }, { status: 503 });
  }
}
