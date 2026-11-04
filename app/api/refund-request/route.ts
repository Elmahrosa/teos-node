import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { env } from "../../../lib/env";

const redis = env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")
  ? new Redis({ url: env("UPSTASH_REDIS_REST_URL")!, token: env("UPSTASH_REDIS_REST_TOKEN")! }) : null;

export async function POST(req: Request) {
  const { signature, quote_id, wallet, reason } = await req.json().catch(() => ({}));
  if (typeof signature !== "string" || typeof wallet !== "string") return NextResponse.json({ error: "missing_signature_or_wallet" }, { status: 400 });
  if (!redis) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const c = (v: unknown, n: number) => String(v ?? "").slice(0, n);
  await redis.lpush("teos:support:refunds", JSON.stringify({ signature: c(signature, 100), quote_id: c(quote_id, 64), wallet: c(wallet, 64), reason: c(reason, 500), at: Date.now() }));
  await redis.ltrim("teos:support:refunds", 0, 999);
  return NextResponse.json({ status: "received" }, { status: 202 });
}