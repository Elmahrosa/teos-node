import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  if (!cookie.includes("founder-auth=1")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ total: 0, countries: [] });
}
