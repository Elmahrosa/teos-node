import { NextResponse } from "next/server";
import { verifySession } from "../../../../lib/founderAuth";

export const dynamic = "force-dynamic";

const RESERVED = ["ayman", "elmahrosa", "teos", "admin", "api", "www", "mail", "root", "support", "web4"];

export async function POST(req: Request) {
  if (!verifySession(req.headers.get("cookie"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
  const wallet = String(body.wallet || "").trim();
  if (!name || !wallet) return NextResponse.json({ ok: false, error: "name and wallet required" }, { status: 400 });
  if (RESERVED.includes(name)) return NextResponse.json({ ok: false, error: "name is reserved" }, { status: 400 });
  // Not wired to the registry yet: returns success only.
  return NextResponse.json({ ok: true, name, wallet, result: "granted" });
}