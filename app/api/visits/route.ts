import { NextResponse } from "next/server";
import { verifySession } from "../../../lib/founderAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!verifySession(req.headers.get("cookie"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ total: 0, countries: [] });
}