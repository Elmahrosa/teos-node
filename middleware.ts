import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCsp } from "./lib/csp";
import { verifySessionEdge } from "./lib/session-edge";

// Runs on every page request (API routes and static assets are excluded by the matcher).
// 1) Real server-side gate for /founder: no valid session = redirect, the admin shell is never served.
// 2) Per-request CSP nonce, passed to Next (it stamps its own scripts) and to app/layout.tsx (inline scripts).
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const dev = process.env.NODE_ENV !== "production";
  const reportOnly = process.env.CSP_REPORT_ONLY === "1"; // emergency switch if a wallet flow ever needs debugging
  const cspName = reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";

  const isFounderArea = path === "/founder" || path.startsWith("/founder/");
  if (isFounderArea && path !== "/founder/login") {
    const ok = await verifySessionEdge(req.headers.get("cookie"), process.env.FOUNDER_SESSION_SECRET?.trim() ?? "");
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/founder/login";
      url.search = "";
      const redirect = NextResponse.redirect(url);
      redirect.headers.set("Cache-Control", "no-store");
      redirect.headers.set("X-Robots-Tag", "noindex, nofollow");
      return redirect;
    }
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, dev);
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-nonce", nonce);
  reqHeaders.set(cspName, csp);

  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.headers.set(cspName, csp);
  if (isFounderArea) {
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|\\.well-known/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp4|webm|txt|xml|json|js|css|woff2?|ttf|map)$).*)",
  ],
};