import { NextResponse } from "next/server";
import { Transaction } from "@solana/web3.js";
import { env } from "../../../lib/env";
import { checkRateLimit, rateLimitResponse } from "../../../lib/rate-limit";
import { sameOrigin } from "../../../lib/origin";

export const dynamic = "force-dynamic";

// Same-origin JSON-RPC proxy for the browser wallet flow. The public api.mainnet-beta.solana.com endpoint
// answers 403 to many browsers/IPs, which broke sendTransaction after the wallet had signed.
//
// This sits in front of the Helius key, so it is locked down:
//  - same-origin browser requests only (Origin / Sec-Fetch-Site; a script can forge these, so they are not the real guard)
//  - 4 methods only, one call per request, body under 4 KB
//  - sendTransaction / simulateTransaction are forwarded only for the exact payment shape the frontend builds:
//    legacy transaction, only System Program transfers, every one of them to TREASURY_WALLET
//  - 20 requests per minute per client
const ALLOWED = new Set(["sendTransaction", "simulateTransaction", "getSignatureStatuses", "getLatestBlockhash"]);
const MAX_BODY = 4096;
const SYSTEM_PROGRAM = "11111111111111111111111111111111";

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

// True only for a legacy transaction whose every instruction is a System Program transfer to the treasury.
function isTreasuryPayment(encoded: unknown, encoding: unknown): boolean {
  const treasury = env("TREASURY_WALLET");
  if (!treasury || typeof encoded !== "string" || (encoding !== undefined && encoding !== "base64")) return false;
  try {
    const tx = Transaction.from(Buffer.from(encoded, "base64"));
    if (!tx.instructions.length || tx.instructions.length > 3) return false;
    return tx.instructions.every(
      (ix) => ix.programId.toBase58() === SYSTEM_PROGRAM && ix.data.length === 12 && ix.data.readUInt32LE(0) === 2 && ix.keys[1]?.pubkey.toBase58() === treasury,
    );
  } catch { return false; }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const rl = await checkRateLimit("rpc", 20, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  const text0 = await req.text().catch(() => "");
  if (!text0 || text0.length > MAX_BODY) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  let body: any = null;
  try { body = JSON.parse(text0); } catch { /* handled below */ }
  // One call per request: no batches.
  if (!body || Array.isArray(body) || typeof body !== "object" || !ALLOWED.has(body.method)) {
    return NextResponse.json({ error: "method_not_allowed" }, { status: 403 });
  }
  if ((body.method === "sendTransaction" || body.method === "simulateTransaction") && !isTreasuryPayment(body.params?.[0], body.params?.[1]?.encoding)) {
    console.warn("[rpc] rejected_tx_shape", body.method, JSON.stringify(describeTx(body.params?.[0], body.params?.[1]?.encoding)).slice(0, 400));
    return NextResponse.json({ error: "tx_not_allowed" }, { status: 403 });
  }
  const calls: any[] = [body];
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
