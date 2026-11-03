import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const expected = process.env.FOUNDER_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  const { password } = await req.json().catch(() => ({}));
  if (password !== expected) {
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("founder-auth", "1", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("founder-auth", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}

export async function GET() {
  const configured = !!process.env.FOUNDER_PASSWORD;
  return NextResponse.json({ configured });
}
