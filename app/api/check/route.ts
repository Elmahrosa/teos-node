import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { parseDomain } from "../../../lib/domain-rules";
import { parseTlds, liveTlds } from "../../../lib/tlds";
import { checkTlds } from "../../../lib/check";
import { getSolUsd } from "../../../lib/pricing";
import { isTestMintName, isTestMintWallet, TEST_MINT_LAMPORTS } from "../../../lib/testMint";
// GET /api/check?name=ahmed&tlds=teos,eg,sa  (tlds optional: defaults to every live TLD)
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit("check", 60, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  try {
    const parsed = parseDomain(req.nextUrl.searchParams.get("name"));
    if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
    const raw = req.nextUrl.searchParams.get("tlds");
    const tlds = raw ? parseTlds(raw) : liveTlds().map((t) => t.tld);
    if (!tlds) return NextResponse.json({ error: "invalid_tlds" }, { status: 400 });
    let results: any[] = await checkTlds(parsed.domain, tlds);
    const sol_usd = await getSolUsd();
    // 1.teos is whitelist-only: the whitelisted wallet sees the 0.001 SOL test price, everyone else sees it as reserved.
    if (isTestMintName(parsed.domain, tlds)) {
      const ok = isTestMintWallet(req.nextUrl.searchParams.get("wallet"));
      results = results.map((r) => {
        if (r.tld !== "teos") return r;
        if (!ok) return { ...r, available: false, reason: r.reason ?? "reserved" };
        return { ...r, price_sol: TEST_MINT_LAMPORTS / 1e9, test_price: true, price_usd: sol_usd ? Number(((TEST_MINT_LAMPORTS / 1e9) * sol_usd).toFixed(4)) : 0 };
      });
    }
    const total_usd = results.filter((r) => r.available).reduce((n, r) => n + r.price_usd, 0);
    return NextResponse.json({ name: parsed.domain, results, total_usd, sol_usd });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

