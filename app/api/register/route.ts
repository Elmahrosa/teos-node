import { NextResponse } from "next/server";
import { parseDomain } from "../../../lib/domain-rules";
import { getQuote, markUsed } from "../../../lib/quoteStore";
import { verifyWalletSignature } from "../../../lib/sig";
import { isClaimed, claim } from "../../../lib/registry";
import { mintTeosAsset } from "../../../lib/teos";

const bad = (reason: string) => NextResponse.json({ error: "invalid_quote", reason }, { status: 401 });

export async function POST(req: Request) {
  // Closed until on-chain payment verification ships. Set REGISTRATION_OPEN=true to enable.
  if (process.env.REGISTRATION_OPEN !== "true") {
    return NextResponse.json({ error: "registration_closed" }, { status: 503, headers: { "Retry-After": "3600" } });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { quote_id, signature, publicKey } = body ?? {};
    const parsed = parseDomain(body?.domain);
    if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
    if ([quote_id, signature, publicKey].some((v) => typeof v !== "string" || !v)) {
      return NextResponse.json({ error: "missing_signature_or_quote" }, { status: 400 });
    }

    const quote = await getQuote(quote_id);
    if (!quote) return bad("not_found_or_expired");
    if (quote.used) return bad("already_used");
    if (quote.domain !== parsed.domain) return bad("domain_mismatch");
    if (Date.now() > quote.expiresAt) return bad("expired");

    if (!(await verifyWalletSignature(quote.message, signature, publicKey))) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }

    if (isClaimed(quote.domain)) return NextResponse.json({ error: "already_minted" }, { status: 401 });
    claim(quote.domain, publicKey);
    await markUsed(quote.id);
    await mintTeosAsset(quote.domain, publicKey); // stub until #5
    return NextResponse.json({
      success: true,
      pending_mint: true,
      domain: `${quote.domain}.teos`,
      owner: publicKey,
      quote_id: quote.id,
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
