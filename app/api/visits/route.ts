import { NextResponse } from "next/server";
import { verifySession } from "../../../lib/founderAuth";
import { getStats } from "../../../lib/visitors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!verifySession(req.headers.get("cookie"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const s = await getStats();
    // `countries` on the founder page means unlocked country TLDs, which this does not track.
    return NextResponse.json({ total: s.total, countries: [], tracking: true });
  } catch {
    return NextResponse.json({ total: null, countries: [], tracking: false });
  }
}
