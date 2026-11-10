import { NextResponse } from "next/server";
import { env } from "../../../lib/env";
import { checkRateLimit, rateLimitResponse } from "../../../lib/rate-limit";
import { createQuote } from "../../../lib/quoteStore";
import { requestedTlds, isSaleTld, getTld } from "../../../lib/tlds";

export async function POST(req: Request) {
  try {
    // Gate first: no quotes, Redis writes or RPC calls while registration is closed.
    if (env("REGISTRATION_OPEN") !== "true") {
      return NextResponse.json(
        { error: "registration_closed" },
        { status: 503, headers: { "Retry-After": "3600" } }
      );
    }

    // Each quote costs a Redis write plus RPC and price lookups: cap it per client.
    const rl = await checkRateLimit("quote", 20, 60);
    if (!rl.allowed) return rateLimitResponse(rl.resetInSec);

    // Fail closed: never hand a client a null payment address.
    const treasury = env("TREASURY_WALLET");
    if (!treasury) {
      console.error("[quote] treasury_not_configured");
      return NextResponse.json({ error: "payments_unavailable" }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    // Accept "name.tld" in domain as well as a separate tlds field.
    let rawDomain: unknown = body?.domain;
    let rawTlds: unknown = body?.tlds;
    if (typeof rawDomain === "string" && rawDomain.includes(".")) {
      const i = rawDomain.lastIndexOf(".");
      const suffix = rawDomain.slice(i + 1).trim().toLowerCase();
      if (getTld(suffix)) { rawTlds = rawTlds ?? suffix; rawDomain = rawDomain.slice(0, i); }
    }
    // Only sale namespaces (teos) are open. Anything else is refused before any pricing or mint check.
    const blockedTld = requestedTlds(rawTlds).find((t) => !isSaleTld(t));
    if (blockedTld) {
      return NextResponse.json(
        { error: "registration_closed", message: "TLD blocked", tld: blockedTld },
        { status: 503, headers: { "Retry-After": "3600" } }
      );
    }
    const r = await createQuote(rawDomain, rawTlds);
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
