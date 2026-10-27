import { NextResponse } from "next/server";
import { createQuote } from "../../../lib/quoteStore";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const r = await createQuote(body?.domain);
    if (!r.ok) return NextResponse.json(r.body, { status: r.status });
    const q = r.quote;
    return NextResponse.json({
      quote_id: q.id,
      domain: q.domain,
      price_sol: q.priceLamports / 1e9,
      price_lamports: q.priceLamports,
      expires_at: q.expiresAt,
      message_to_sign: q.message,
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
