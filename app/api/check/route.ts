import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { parseDomain } from "../../../lib/domain-rules";
import { parseTlds, liveTlds } from "../../../lib/tlds";
import { checkTlds } from "../../../lib/check";
import { getSolUsd } from "../../../lib/pricing";
// GET /api/check?name=ahmed&tlds=teos,eg,sa  (tlds optional: defaults to every live namespace)
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit("check", 60, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  try {
    const parsed = parseDomain(req.nextUrl.searchParams.get("name"));
    if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
    const raw = req.nextUrl.searchParams.get("tlds");
    const tlds = raw ? parseTlds(raw) : liveTlds().map((t) => t.tld);
    if (!tlds) return NextResponse.json({ error: "invalid_tlds" }, { status: 400 });
    const results: any[] = await checkTlds(parsed.domain, tlds);
    const sol_usd = await getSolUsd();
    const total_usd = results.filter((r) => r.available).reduce((n, r) => n + r.price_usd, 0);
    return NextResponse.json({ name: parsed.domain, results, total_usd, sol_usd });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

