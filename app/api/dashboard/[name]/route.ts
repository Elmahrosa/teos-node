import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "../../../../lib/rate-limit";
import { parseDomain } from "../../../../lib/domain-rules";
import { verifyWalletSignature } from "../../../../lib/sig";
import { ownsTeosOnChain } from "../../../../lib/ownership";
import { buildTldRows, dashboardMessage, DASHBOARD_MAX_AGE_MS } from "../../../../lib/dashboard";

export const dynamic = "force-dynamic";

// POST { publicKey, signature, ts }: the wallet signs teos://dashboard/<name>/<ts>. Only the wallet that
// currently holds <name>.teos on-chain gets the full namespace list. Read-only; works while registration is closed.
export async function POST(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const rl = await checkRateLimit("dashboard", 20, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  try {
    const parsed = parseDomain((await params).name);
    if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
    const name = parsed.domain;
    const body: any = await req.json().catch(() => ({}));
    const { publicKey, signature, ts } = body ?? {};
    if (typeof publicKey !== "string" || typeof signature !== "string" || !Number.isSafeInteger(ts)) {
      return NextResponse.json({ error: "missing_signature" }, { status: 400 });
    }
    const age = Date.now() - ts;
    if (age > DASHBOARD_MAX_AGE_MS || age < -60_000) return NextResponse.json({ error: "signature_expired" }, { status: 401 });
    if (!(await verifyWalletSignature(dashboardMessage(name, ts), signature, publicKey))) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
    const owns = await ownsTeosOnChain(publicKey, name);
    if (owns === null) return NextResponse.json({ error: "ownership_check_unavailable" }, { status: 503 });
    if (!owns) return NextResponse.json({ error: "not_owner" }, { status: 403, headers: { "cache-control": "no-store" } });
    const rows = await buildTldRows(name);
    return NextResponse.json({ name, owner: publicKey, count: rows.length, rows }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
