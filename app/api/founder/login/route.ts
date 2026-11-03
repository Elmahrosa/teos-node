import { NextResponse } from "next/server";
import { env } from "../../../../lib/env";
import { passwordOk, signSession } from "../../../../lib/founderAuth";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!env("FOUNDER_PASSWORD") || !env("FOUNDER_SESSION_SECRET"))
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  const { password } = await req.json().catch(() => ({}));
  if (typeof password !== "string" || !passwordOk(password))
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("founder-auth", signSession(), { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 604800 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("founder-auth", "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return res;
}

export async function GET() {
  return NextResponse.json({ configured: !!(env("FOUNDER_PASSWORD") && env("FOUNDER_SESSION_SECRET")) });
}