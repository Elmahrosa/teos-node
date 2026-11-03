import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { env } from "../../../lib/env";

const redis = env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")
  ? new Redis({ url: env("UPSTASH_REDIS_REST_URL")!, token: env("UPSTASH_REDIS_REST_TOKEN")! }) : null;

export async function POST(req: Request) {
  const { signature, quote_id, wallet, reason } = await req.json().catch(() => ({}));
  if (typeof signature !== "string" || typeof wallet !== "string") return NextResponse.json({ error: "missing_signature_or_wallet" }, { status: 400 });
  if (!redis) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  await redis.lpush("teos:support:refunds", JSON.stringify({ signature, quote_id, wallet, reason: String(reason ?? "").slice(0, 500), at: Date.now() }));
  return NextResponse.json({ status: "received" }, { status: 202 });
}