import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "../../../../lib/rate-limit";
import { parseDomain } from "../../../../lib/domain-rules";
import { verifyWalletSignature } from "../../../../lib/sig";
import { ownsTeosOnChain } from "../../../../lib/ownership";
import { sanitizeSite, siteMessage, SITE_MAX_AGE_MS } from "../../../../lib/sites";
import { getSite, saveSite } from "../../../../lib/sites-store";

export const dynamic = "force-dynamic";

async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Public read: the published site for <name>.teos, or 404.
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const rl = await checkRateLimit("site-read", 120, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  const parsed = parseDomain((await params).name);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const site = await getSite(parsed.domain).catch(() => null);
  if (!site) return NextResponse.json({ error: "no_site" }, { status: 404 });
  const { owner: _o, ...pub } = site;
  return NextResponse.json({ name: parsed.domain, site: pub }, { headers: { "cache-control": "no-store" } });
}

// POST { publicKey, signature, ts, content }: the wallet signs teos://site/<name>/<ts>/<sha256(content)>.
// Only the wallet that currently holds <name>.teos on-chain may publish. content is a JSON string of the site config.
export async function POST(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const rl = await checkRateLimit("site-write", 10, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  try {
    const parsed = parseDomain((await params).name);
    if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
    const name = parsed.domain;
    const body: any = await req.json().catch(() => ({}));
    const { publicKey, signature, ts, content } = body ?? {};
    if (typeof publicKey !== "string" || typeof signature !== "string" || typeof content !== "string" || !Number.isSafeInteger(ts)) {
      return NextResponse.json({ error: "missing_signature" }, { status: 400 });
    }
    if (content.length > 20_000) return NextResponse.json({ error: "too_large" }, { status: 413 });
    const age = Date.now() - ts;
    if (age > SITE_MAX_AGE_MS || age < -60_000) return NextResponse.json({ error: "signature_expired" }, { status: 401 });
    if (!(await verifyWalletSignature(siteMessage(name, ts, await sha256Hex(content)), signature, publicKey))) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
    const owns = await ownsTeosOnChain(publicKey, name);
    if (owns === null) return NextResponse.json({ error: "ownership_check_unavailable" }, { status: 503 });
    if (!owns) return NextResponse.json({ error: "not_owner" }, { status: 403 });
    let raw: unknown;
    try { raw = JSON.parse(content); } catch { return NextResponse.json({ error: "bad_content" }, { status: 400 }); }
    const site = await saveSite(name, publicKey, sanitizeSite(raw));
    return NextResponse.json({ ok: true, url: `/s/${name}`, updatedAt: site.updatedAt }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
