import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseDomain } from "../../../../lib/domain-rules";
import { getClaim } from "../../../../lib/registry";
import { getTld, fullName } from "../../../../lib/tlds";

const BASE = process.env.PUBLIC_BASE_URL?.trim() || "https://web4.elmahrosa.org";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const parsed = parseDomain((await params).name);
    if (!parsed.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const name = parsed.domain;
    const tld = (new URL(req.url).searchParams.get("tld") || "teos").toLowerCase();
    if (!getTld(tld)) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const claim = await getClaim(fullName(name, tld));
    if (!claim) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const crest = fs.existsSync(path.join(process.cwd(), "public", "crests", `${name}.${tld}.png`))
      ? `/crests/${name}.${tld}.png`
      : "/genesis-seal.png";
    return NextResponse.json({
      name: `${name.toUpperCase()}.${tld.toUpperCase()}`,
      symbol: "TEOS",
      description: `${name.toUpperCase()}.${tld.toUpperCase()} - a Web4 domain on the TEOS Network (Solana).`,
      image: `${BASE}${crest}`,
      external_url: BASE,
      attributes: [
        { trait_type: "Namespace", value: `.${tld}` },
        { trait_type: "Name", value: name },
        { trait_type: "Network", value: "Solana" },
      ],
      properties: { category: "image", files: [{ uri: `${BASE}${crest}`, type: "image/png" }] },
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
