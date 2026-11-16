import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "../../../../lib/rate-limit";
import { parseDomain } from "../../../../lib/domain-rules";
import { verifyWalletSignature } from "../../../../lib/sig";
import { ownsTeosOnChain } from "../../../../lib/ownership";
import { sanitizeSite, siteMessage, sitePublishMessage, SITE_MAX_AGE_MS, type StoredSite } from "../../../../lib/sites";
import { getSite, getSnapshot, isSiteStoreUnavailable, saveSite, saveSnapshot, SITE_STORE_UNAVAILABLE } from "../../../../lib/sites-store";
import { snapshotOf } from "../../../../lib/site-snapshot";
import { isCidV1Raw } from "../../../../lib/ipfs";

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
  let site: StoredSite | null;
  try {
    site = await getSite(parsed.domain);
  } catch (err) {
    if (isSiteStoreUnavailable(err)) return NextResponse.json({ error: SITE_STORE_UNAVAILABLE }, { status: 503 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
  if (!site) return NextResponse.json({ error: "no_site" }, { status: 404 });
  const { owner: _o, ...pub } = site;
  const snap = await getSnapshot(parsed.domain);
  return NextResponse.json(
    {
      name: parsed.domain,
      site: pub,
      snapshot: snap
        ? { cid: snap.cid, sha256: snap.sha256, bytes: snap.bytes, signed: snap.signed, at: snap.at, signer: snap.signer, url: `/api/site/${parsed.domain}/snapshot` }
        : null,
    },
    { headers: { "cache-control": "no-store" } }
  );
}

// POST { publicKey, signature, ts, content, cid }: the wallet signs
// teos://site/<name>/<ts>/<sha256(content)>/<cid>. The older message without the CID is still
// accepted so cached clients keep working; its snapshot is stored as unsigned.
// Only the wallet that currently holds <name>.teos on-chain may publish. content is a JSON string of the site config.
export async function POST(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const rl = await checkRateLimit("site-write", 10, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  try {
    const parsed = parseDomain((await params).name);
    if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
    const name = parsed.domain;
    const body: any = await req.json().catch(() => ({}));
    const { publicKey, signature, ts, content, cid } = body ?? {};
    if (typeof publicKey !== "string" || typeof signature !== "string" || typeof content !== "string" || !Number.isSafeInteger(ts)) {
      return NextResponse.json({ error: "missing_signature" }, { status: 400 });
    }
    if (content.length > 20_000) return NextResponse.json({ error: "too_large" }, { status: 413 });
    const age = Date.now() - ts;
    if (age > SITE_MAX_AGE_MS || age < -60_000) return NextResponse.json({ error: "signature_expired" }, { status: 401 });
    // New clients sign the CID as well, which proves the owner chose these exact bytes. Older
    // clients only cover the content hash, so their snapshot is kept but marked unsigned.
    const withCid = cid !== undefined;
    if (withCid && !isCidV1Raw(cid)) return NextResponse.json({ error: "invalid_cid" }, { status: 400 });
    const hash = await sha256Hex(content);
    const message = withCid ? sitePublishMessage(name, ts, hash, cid) : siteMessage(name, ts, hash);
    if (!(await verifyWalletSignature(message, signature, publicKey))) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
    const owns = await ownsTeosOnChain(publicKey, name);
    if (owns === null) return NextResponse.json({ error: "ownership_check_unavailable" }, { status: 503 });
    if (!owns) return NextResponse.json({ error: "not_owner" }, { status: 403 });
    let raw: unknown;
    try { raw = JSON.parse(content); } catch { return NextResponse.json({ error: "bad_content" }, { status: 400 }); }
    const cfg = sanitizeSite(raw);
    const snap = snapshotOf(name, cfg);
    if (withCid && snap.cid !== cid) {
      // The signed CID does not describe what we would actually serve: refuse instead of
      // publishing content under an address the owner never agreed to.
      return NextResponse.json({ error: "cid_mismatch" }, { status: 409 });
    }
    const site = await saveSite(name, publicKey, cfg);
    try {
      await saveSnapshot(name, { cid: snap.cid, sha256: snap.sha256, bytes: snap.bytes, signed: withCid, at: ts, signer: publicKey, html: snap.html });
    } catch (err) {
      if (err instanceof Error && err.message === "snapshot_too_large") return NextResponse.json({ error: "too_large" }, { status: 413 });
      throw err;
    }
    return NextResponse.json(
      {
        ok: true,
        url: `/s/${name}`,
        updatedAt: site.updatedAt,
        cid: snap.cid,
        sha256: snap.sha256,
        bytes: snap.bytes,
        signed: withCid,
        snapshotUrl: `/api/site/${name}/snapshot`,
        manifestUrl: `/api/site/${name}/manifest`,
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (err) {
    if (isSiteStoreUnavailable(err)) return NextResponse.json({ error: SITE_STORE_UNAVAILABLE }, { status: 503 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
