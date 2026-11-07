import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isFounderLocked, recordFounderFail, clearFounderFails } from "@/lib/founder-lockout";
import { NextResponse } from "next/server";
import { founderLoginConfigured, passwordOk, sessionCookieName, sessionCookieSecure, signSession } from "../../../../lib/founderAuth";
import { sameOrigin } from "../../../../lib/origin";

export const dynamic = "force-dynamic";

const MAX_AGE = 604800;
const cookieOpts = { httpOnly: true, secure: sessionCookieSecure(), sameSite: "strict" as const, path: "/" };
const noStore = { "Cache-Control": "no-store" };

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });

  // Lockout first, so a locked client sees 423 instead of being hidden behind 429.
  const lock = await isFounderLocked();
  if (lock.locked) return NextResponse.json({ error: "locked", retry_after: lock.retryAfter }, { status: 423, headers: noStore });

  const rl = await checkRateLimit("founder-login", 5, 300);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);

  const { password } = await req.json().catch(() => ({}));

  // Same answer whether the server is unconfigured or the password is wrong: nothing about our setup leaks.
  if (!founderLoginConfigured() || typeof password !== "string" || password.length > 512 || !(await passwordOk(password))) {
    await recordFounderFail();
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401, headers: noStore });
  }

  await clearFounderFails();
  const res = NextResponse.json({ ok: true }, { headers: noStore });
  res.cookies.set(sessionCookieName(), signSession(MAX_AGE), { ...cookieOpts, maxAge: MAX_AGE });
  return res;
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });
  const res = NextResponse.json({ ok: true }, { headers: noStore });
  res.cookies.set(sessionCookieName(), "", { ...cookieOpts, maxAge: 0 });
  return res;
}

// Never advertise whether the admin surface is configured.
export async function GET() {
  return new NextResponse(null, { status: 404 });
}