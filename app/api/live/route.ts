import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Liveness probe: answers 200 whenever the server can render a response.
// Readiness (env, RPC, store, mint funds) stays on /api/health, so a missing key is never hidden.
// Point uptime monitors and platform healthchecks here, not at /api/health.
export async function GET() {
  return NextResponse.json(
    { ok: true, ts: Date.now() },
    { headers: { "cache-control": "no-store" } }
  );
}
