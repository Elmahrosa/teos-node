import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "../../../../../lib/rate-limit";
import { parseDomain } from "../../../../../lib/domain-rules";
import { getSnapshot, isSiteStoreUnavailable, SITE_STORE_UNAVAILABLE } from "../../../../../lib/sites-store";

export const dynamic = "force-dynamic";

// The exact bytes the manifest hashes. Rendered from sanitized site data only: no stored user HTML,
// no scripts, no external CSS. Served with its own strict CSP because middleware skips /api.
const SNAPSHOT_CSP = "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const rl = await checkRateLimit("site-snapshot", 240, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  const parsed = parseDomain((await params).name);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const name = parsed.domain;
  try {
    const snap = await getSnapshot(name);
    if (!snap) return NextResponse.json({ error: "no_snapshot" }, { status: 404 });
    const download = new URL(req.url).searchParams.get("download") === "1";
    return new NextResponse(snap.html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": SNAPSHOT_CSP,
        "x-content-type-options": "nosniff",
        "x-teos-cid": snap.cid,
        "x-teos-sha256": snap.sha256,
        "link": `</api/site/${name}/manifest>; rel="alternate"; type="application/json"`,
        "cache-control": "no-cache",
        ...(download ? { "content-disposition": `attachment; filename="${name}.teos.html"` } : {}),
      },
    });
  } catch (err) {
    if (isSiteStoreUnavailable(err)) return NextResponse.json({ error: SITE_STORE_UNAVAILABLE }, { status: 503 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
