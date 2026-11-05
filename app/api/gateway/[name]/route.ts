import { NextResponse } from "next/server";
import { getClaim } from "../../../../lib/registry";
import { isSealedDomain } from "../../../../lib/sealed";
import { isNotForSaleDomain } from "../../../../lib/domain-rules";

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const clean = (await params).name.toLowerCase().replace(/\.teos$/, "");
  if (isNotForSaleDomain(clean)) {
    return NextResponse.json(
      { sovereign: clean, status: "RESERVED", reason: "NOT_FOR_SALE", registryKnown: false, nftVerified: false, live: false },
      { status: 409 }
    );
  }
  const claim = await getClaim(clean);
  const registryKnown = isSealedDomain(clean) || !!claim;
  if (!registryKnown) return NextResponse.json({ sovereign: clean, status: "UNREGISTERED", registryKnown: false, nftVerified: false, live: false }, { status: 404 });
  return NextResponse.json({
    sovereign: clean,
    tld: ".teos",
    status: "REGISTRY_RESOLVED",
    registryKnown: true,
    nftVerified: false,
    ownershipMismatch: null,
    gateway: `web4.elmahrosa.org/u/${clean}`,
    live: false,
    timestamp: new Date().toISOString()
  });
}