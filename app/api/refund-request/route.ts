import { NextResponse } from "next/server";
import { env } from "../../../lib/env";
import { redis } from "../../../lib/redis";
import { checkRateLimit, checkRateLimitKey, rateLimitResponse } from "../../../lib/rate-limit";

const B58_SIG = /^[1-9A-HJ-NP-Za-km-z]{64,100}$/;
const B58_KEY = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const QUOTE_ID = /^[A-Za-z0-9_-]{8,64}$/;
const MAX_BODY = 4096;

export async function POST(req: Request) {
  // Per-IP and global caps: one attacker cannot flood the queue and push real requests out.
  const rl = await checkRateLimit("refund", 5, 3600);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  const global = await checkRateLimitKey("refund-global", 300, 3600);
  if (!global.allowed) return rateLimitResponse(global.resetInSec);

  const text = await req.text().catch(() => "");
  if (text.length > MAX_BODY) return NextResponse.json({ error: "too_large" }, { status: 413 });
  let body: any = {};
  try { body = JSON.parse(text || "{}"); } catch { /* handled below */ }
  const { signature, quote_id, wallet, reason } = body ?? {};

  if (typeof signature !== "string" || !B58_SIG.test(signature) || typeof wallet !== "string" || !B58_KEY.test(wallet))
    return NextResponse.json({ error: "missing_signature_or_wallet" }, { status: 400 });
  if (quote_id !== undefined && quote_id !== "" && (typeof quote_id !== "string" || !QUOTE_ID.test(quote_id)))
    return NextResponse.json({ error: "invalid_quote_id" }, { status: 400 });
  if (!redis) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  // One request per payment signature.
  const fresh = await redis.set(`teos:support:refund-sig:${signature}`, "1", { nx: true, ex: 30 * 86400 });
  if (fresh !== "OK") return NextResponse.json({ status: "received" }, { status: 202 });

  const clip = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, n);
  await redis.lpush("teos:support:refunds", JSON.stringify({ signature, quote_id: clip(quote_id, 64), wallet, reason: clip(reason, 500), at: Date.now() }));
  await redis.ltrim("teos:support:refunds", 0, 4999);
  return NextResponse.json({ status: "received" }, { status: 202 });
}