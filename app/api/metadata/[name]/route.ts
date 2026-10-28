import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseDomain } from "../../../../lib/domain-rules";
import { getClaim } from "../../../../lib/registry";

const BASE = process.env.PUBLIC_BASE_URL?.trim() || "https://web4.elmahrosa.org";

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  try {
    const parsed = parseDomain(params.name);
    if (!parsed.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const name = parsed.domain;
    const claim = await getClaim(name);
    if (!claim) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const crest = fs.existsSync(path.join(process.cwd(), "public", "crests", `${name}.teos.png`))
      ? `/crests/${name}.teos.png`
      : "/genesis-seal.png";
    return NextResponse.json({
      name: `${name.toUpperCase()}.TEOS`,
      symbol: "TEOS",
      description: `${name.toUpperCase()}.TEOS - a Web4 domain on the TEOS Network (Solana).`,
      image: `${BASE}${crest}`,
      external_url: BASE,
      attributes: [
        { trait_type: "Namespace", value: ".teos" },
        { trait_type: "Name", value: name },
        { trait_type: "Network", value: "Solana" },
      ],
      properties: { category: "image", files: [{ uri: `${BASE}${crest}`, type: "image/png" }] },
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
