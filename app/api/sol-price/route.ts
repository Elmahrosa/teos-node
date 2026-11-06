import { NextResponse } from "next/server";
import { getSolUsd } from "../../../lib/pricing";

export const dynamic = "force-dynamic";

// Live SOL/USD for the price table. Display only: payment amounts come from /api/quote.
export async function GET() {
  const sol_usd = await getSolUsd();
  return NextResponse.json({ sol_usd, at: Date.now() }, { headers: { "cache-control": "no-store" } });
}
