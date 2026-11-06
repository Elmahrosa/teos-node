import { NextResponse } from "next/server";
import { env } from "../../../lib/env";
import { createQuote } from "../../../lib/quoteStore";

export async function POST(req: Request) {
  try {
    // Gate first: no quotes, Redis writes or RPC calls while registration is closed.
    if (env("REGISTRATION_OPEN") !== "true") {
      return NextResponse.json(
        { error: "registration_closed" },
        { status: 503, headers: { "Retry-After": "3600" } }
      );
    }

    // Fail closed: never hand a client a null payment address.
    const treasury = env("TREASURY_WALLET");
    if (!treasury) {
      console.error("[quote] treasury_not_configured");
      return NextResponse.json({ error: "payments_unavailable" }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const r = await createQuote(body?.domain, body?.tlds);
    if (!r.ok) return NextResponse.json(r.body, { status: r.status });
    const q = r.quote;
    return NextResponse.json({
      quote_id: q.id,
      domain: q.domain,
      price_sol: q.priceLamports / 1e9,
      price_lamports: q.priceLamports,
      price_usd: q.priceUsd,
      is_promo: q.isPromo,
      tlds: q.tlds ?? ["teos"],
      expires_at: q.expiresAt,
      message_to_sign: q.message,
      pay_to: treasury,
    });
  } catch (e) {
    console.error("[quote] internal_error", e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
