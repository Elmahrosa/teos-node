import { NextResponse } from "next/server";
import { env } from "../../../lib/env";
import { verifySession } from "../../../lib/founderAuth";
import { registryPersistent } from "../../../lib/registry";
import { mintFunds, mintConfigured } from "../../../lib/mint";
import { getSolUsd } from "../../../lib/pricing";

export const dynamic = "force-dynamic";

// Public: { ok } only. With a founder session: which launch prerequisites are missing.
export async function GET(req: Request) {
  const checks = {
    registration_open: env("REGISTRATION_OPEN") === "true",
    treasury_wallet: !!env("TREASURY_WALLET"),
    rpc: !!(env("HELIUS_API_KEY") || env("HELIUS_RPC_URL")),
    persistent_registry: registryPersistent,
    memory_registry_override_off: env("ALLOW_MEMORY_REGISTRY") !== "true",
    mint_key: mintConfigured(),
    mint_funds: (await mintFunds(1).catch(() => ({ ok: false }))).ok,
    sol_price: !!(await getSolUsd().catch(() => null)),
    founder_login: !!(env("FOUNDER_PASSWORD") && env("FOUNDER_SESSION_SECRET")),
  };
  const ok = Object.values(checks).every(Boolean);
  if (!verifySession(req.headers.get("cookie"))) return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
