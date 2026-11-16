import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "../../../../../lib/rate-limit";
import { parseDomain } from "../../../../../lib/domain-rules";
import { verifyWalletSignature } from "../../../../../lib/sig";
import { ownsTeosOnChain } from "../../../../../lib/ownership";
import { importMessage, SITE_MAX_AGE_MS } from "../../../../../lib/sites";
import { ImportError, importSiteFromUrl } from "../../../../../lib/site-import";

export const dynamic = "force-dynamic";

async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

// POST { publicKey, signature, ts, url }: imports the content of a site the caller already owns.
// The wallet signs teos://import/<name>/<ts>/<sha256(url)> and must hold <name>.teos on-chain, so this
// cannot be used as an open fetch proxy. Only text and links come back; the client previews them as React text.
export async function POST(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const rl = await checkRateLimit("site-import", 5, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  if (Number(req.headers.get("content-length") || 0) > 10_000) return NextResponse.json({ error: "too_large" }, { status: 413 });
  try {
    const parsed = parseDomain((await params).name);
    if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
    const name = parsed.domain;
    const body: any = await req.json().catch(() => ({}));
    const { publicKey, signature, ts, url } = body ?? {};
    if (typeof publicKey !== "string" || typeof signature !== "string" || typeof url !== "string" || !Number.isSafeInteger(ts)) {
      return NextResponse.json({ error: "missing_signature" }, { status: 400 });
    }
    const age = Date.now() - ts;
    if (age > SITE_MAX_AGE_MS || age < -60_000) return NextResponse.json({ error: "signature_expired" }, { status: 401 });
    if (!(await verifyWalletSignature(importMessage(name, ts, await sha256Hex(url)), signature, publicKey))) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
    const owns = await ownsTeosOnChain(publicKey, name);
    if (owns === null) return NextResponse.json({ error: "ownership_check_unavailable" }, { status: 503 });
    if (!owns) return NextResponse.json({ error: "not_owner" }, { status: 403 });
    const site = await importSiteFromUrl(url);
    return NextResponse.json({ ok: true, site }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    if (err instanceof ImportError) return NextResponse.json({ error: err.code }, { status: 400 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
