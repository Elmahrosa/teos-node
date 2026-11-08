import { NextResponse } from "next/server";
import { verifySession } from "../../../lib/founderAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!verifySession(req.headers.get("cookie"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Visitor analytics are not collected yet; say so instead of reporting a fake 0.
  return NextResponse.json({ total: null, countries: [], tracking: false });
}