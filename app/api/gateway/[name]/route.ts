import { NextResponse } from "next/server";
import { getClaim } from "../../../../lib/registry";
import { isSealedDomain } from "../../../../lib/sealed";

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const clean = (await params).name.toLowerCase().replace(/\.teos$/, "");
  const known = isSealedDomain(clean) || !!(await getClaim(clean));
  if (!known) return NextResponse.json({ sovereign: clean, status: "UNREGISTERED", live: false }, { status: 404 });
  return NextResponse.json({ sovereign: clean, tld: ".teos", status: "SOVEREIGN_RESOLVED", gateway: `web4.elmahrosa.org/u/${clean}`, live: true, timestamp: new Date().toISOString() });
}