import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isFounderLocked, recordFounderFail, clearFounderFails } from "@/lib/founder-lockout";
import { NextResponse } from "next/server";
import { env } from "../../../../lib/env";
import { passwordOk, signSession } from "../../../../lib/founderAuth";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // F-02 FIX: Check lockout FIRST, so 423 shows instead of being hidden behind 429
  const lock = await isFounderLocked();
  if (lock.locked) return NextResponse.json({ error: "locked", retry_after: lock.retryAfter }, { status: 423 });

  const rl = await checkRateLimit("founder-login", 5, 300);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);

  if (!env("FOUNDER_PASSWORD") || !env("FOUNDER_SESSION_SECRET"))
    return NextResponse.json({ error: "not_configured" }, { status: 500 });

  const { password } = await req.json().catch(() => ({}));
  if (typeof password !== "string" || !passwordOk(password)) {
    await recordFounderFail();
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }

  await clearFounderFails();
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