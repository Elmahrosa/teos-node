import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "../../../../../lib/rate-limit";
import { parseDomain } from "../../../../../lib/domain-rules";
import { getSite, getSnapshot, isSiteStoreUnavailable, SITE_STORE_UNAVAILABLE } from "../../../../../lib/sites-store";
import { SNAPSHOT_FORMAT } from "../../../../../lib/site-snapshot";

export const dynamic = "force-dynamic";

// Public proof for a published site: the CID the owner signed, plus the exact hash and size of the
// bytes at /api/site/<name>/snapshot. Nothing here needs a pinning provider or a TEOS account.
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const rl = await checkRateLimit("site-manifest", 120, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  const parsed = parseDomain((await params).name);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const name = parsed.domain;
  try {
    const site = await getSite(name);
    if (!site) return NextResponse.json({ error: "no_site" }, { status: 404 });
    const snap = await getSnapshot(name);
    if (!snap) return NextResponse.json({ error: "no_snapshot" }, { status: 404 });
    const base = `/api/site/${name}`;
    return NextResponse.json(
      {
        name,
        format: SNAPSHOT_FORMAT,
        cid: snap.cid,
        sha256: snap.sha256,
        bytes: snap.bytes,
        signed: snap.signed,
        signer: snap.signer,
        signatureTs: snap.at,
        updatedAt: site.updatedAt,
        snapshot: `${base}/snapshot`,
        download: `${base}/snapshot?download=1`,
        gateways: [`https://ipfs.io/ipfs/${snap.cid}`, `https://dweb.link/ipfs/${snap.cid}`],
        verify: {
          bytes: "sha256 of the snapshot body must equal `sha256`",
          cid: "CIDv1 raw (base32) of the same body must equal `cid`",
          owner: "when `signed` is true, `signer` is the wallet that proved on-chain ownership at publish time",
          message: `teos://site/<name>/<signatureTs>/<sha256(content)>/${snap.cid}`,
          note: "Pinning these bytes anywhere later yields the same CID, so this manifest stays valid.",
        },
      },
      { headers: { "cache-control": "public, max-age=60" } }
    );
  } catch (err) {
    if (isSiteStoreUnavailable(err)) return NextResponse.json({ error: SITE_STORE_UNAVAILABLE }, { status: 503 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
