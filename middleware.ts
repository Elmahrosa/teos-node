import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const path = req.nextUrl.pathname;
  
  if (path.startsWith("/api/")) {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
