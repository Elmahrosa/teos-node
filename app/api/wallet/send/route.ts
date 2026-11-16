import { NextResponse } from "next/server";
import { env } from "../../../../lib/env";
import { checkRateLimit, rateLimitResponse } from "../../../../lib/rate-limit";
import { sameOrigin } from "../../../../lib/origin";
import { inspectTransfer } from "../../../../lib/wallet-send";

export const dynamic = "force-dynamic";

// POST /api/wallet/send { transaction: base64, wallet: base58 } -> { signature }
//
// Why this route exists: /api/rpc only forwards transfers that pay the treasury, so the wallet page cannot
// use it to send SOL anywhere else. This route relays a transaction the user already signed in their own
// wallet, and it never signs anything itself.
//
// The relay is restricted to the exact shape the wallet page builds (see lib/wallet-send): a legacy
// transaction with one System Program transfer, fee-paid and signed by the same wallet. The user's wallet
// is what authorizes the transfer; the shape check only stops this endpoint from being a generic relay.

const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const MAX_TX_BASE64 = 2000;

function upstream(): string {
  const explicit = env("HELIUS_RPC_URL");
  if (explicit) return explicit;
  const key = env("HELIUS_API_KEY");
  return key ? `https://mainnet.helius-rpc.com/?api-key=${key}` : "https://api.mainnet-beta.solana.com";
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const rl = await checkRateLimit("wallet-send", 10, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);

  const body: any = await req.json().catch(() => ({}));
  const transaction = body?.transaction;
  const wallet = body?.wallet;
  if (typeof transaction !== "string" || typeof wallet !== "string" || !B58.test(wallet)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (transaction.length > MAX_TX_BASE64) return NextResponse.json({ error: "too_large" }, { status: 413 });

  const check = inspectTransfer(transaction, wallet);
  if (!check.ok) {
    const status =
      check.error === "wallet_mismatch" || check.error === "tx_not_allowed" ? 403 :
      check.error === "unsigned_transaction" || check.error === "invalid_signature" ? 401 :
      400;
    return NextResponse.json({ error: check.error }, { status });
  }

  try {
    const r = await fetch(upstream(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "wallet-send",
        method: "sendTransaction",
        params: [transaction, { encoding: "base64", preflightCommitment: "confirmed" }],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const json: any = await r.json().catch(() => null);
    const signature = typeof json?.result === "string" ? json.result : "";
    if (!r.ok || json?.error || !signature) {
      const detail = String(json?.error?.message ?? json?.error ?? "rpc_error").slice(0, 200);
      console.error("[wallet-send] rejected", detail);
      return NextResponse.json({ error: "send_failed", detail }, { status: 502 });
    }
    console.log("[wallet-send] sent", signature.slice(0, 100), check.lamports);
    return NextResponse.json({ signature }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("[wallet-send] upstream_failed", String(e?.message ?? e).slice(0, 200));
    return NextResponse.json({ error: "rpc_unavailable" }, { status: 503 });
  }
}
