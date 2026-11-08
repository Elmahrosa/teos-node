import { NextResponse } from "next/server";
import { countryFromHeaders, getStats, recordVisit } from "../../../lib/visitors";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// Public, anonymous. Reads only the country header; the IP is never read or stored.
export async function GET() {
  try {
    return NextResponse.json(await getStats(), { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}

// Called once per browser session (the client guards with sessionStorage).
export async function POST(req: Request) {
  try {
    await recordVisit(countryFromHeaders(req.headers));
    return NextResponse.json(await getStats(), { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}
