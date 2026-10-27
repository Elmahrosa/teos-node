import { NextResponse, type NextRequest } from "next/server";

// In-memory, per-instance limiter. Resets on restart; not shared across replicas.
const hits = new Map<string, { n: number; t: number }>();
const WINDOW = 60_000;

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/api/")) return NextResponse.next();

  const limit = path.startsWith("/api/register") ? 5 : path.startsWith("/api/quote") ? 10 : 30;
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    "unknown";
  const key = `${ip}:${path}`;
  const now = Date.now();

  if (hits.size > 10000) hits.clear();
  const e = hits.get(key);

  if (!e || now - e.t > WINDOW) {
    hits.set(key, { n: 1, t: now });
  } else if (++e.n > limit) {
    return new NextResponse(JSON.stringify({ error: "rate_limited", retry_after: 60 }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": "0",
      },
    });
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
