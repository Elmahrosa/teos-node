import { NextResponse } from "next/server";
import { env } from "../../../lib/env";
import { verifySession, founderLoginConfigured } from "../../../lib/founderAuth";
import { registryPersistent, pendingBacklog } from "../../../lib/registry";
import { redis } from "../../../lib/redis";
import { mintFunds, mintConfigured } from "../../../lib/mint";
import { getSolUsd } from "../../../lib/pricing";

export const dynamic = "force-dynamic";

// Paid-but-unminted names waiting for the retry worker. More than this is unhealthy.
const MAX_PENDING_BACKLOG = 10;

async function redisPing(): Promise<boolean> {
  if (!redis) return false;
  try {
    return (await Promise.race([redis.ping(), new Promise<never>((_, rej) => setTimeout(() => rej(new Error("ping_timeout")), 3000))])) === "PONG";
  } catch { return false; }
}

// Public: { ok } only. With a founder session: which launch prerequisites are missing.
export async function GET(req: Request) {
  const backlog = await pendingBacklog();
  const checks = {
    registration_open: env("REGISTRATION_OPEN") === "true",
    treasury_wallet: !!env("TREASURY_WALLET"),
    rpc: !!(env("HELIUS_API_KEY") || env("HELIUS_RPC_URL")),
    persistent_registry: registryPersistent,
    memory_registry_override_off: env("ALLOW_MEMORY_REGISTRY") !== "true",
    mint_key: mintConfigured(),
    mint_funds: (await mintFunds(1).catch(() => ({ ok: false }))).ok,
    sol_price: !!(await getSolUsd().catch(() => null)),
    founder_login: founderLoginConfigured(),
    collection_address: !!env("COLLECTION_ADDRESS"),
    redis_ping: await redisPing(),
    pending_backlog_ok: backlog !== null && backlog <= MAX_PENDING_BACKLOG,
  };
  const ok = Object.values(checks).every(Boolean);
  if (!verifySession(req.headers.get("cookie"))) return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
  return NextResponse.json({ ok, checks, pending_backlog: backlog }, { status: ok ? 200 : 503 });
}