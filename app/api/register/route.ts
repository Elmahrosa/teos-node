import { NextResponse } from "next/server";
import { parseDomain } from "../../../lib/domain-rules";
import { getQuote, markUsed } from "../../../lib/quoteStore";
import { verifyWalletSignature } from "../../../lib/sig";
import { isClaimed, claimDomain, releaseDomain, recordMint, incrSold, getClaim, claimTx, releaseTx, registryPersistent } from "../../../lib/registry";
import { env } from "../../../lib/env";
import { verifyPayment } from "../../../lib/payment";
import { mintTeosAsset } from "../../../lib/mint";
import { fullName } from "../../../lib/tlds";

const bad = (reason: string) => NextResponse.json({ error: "invalid_quote", reason }, { status: 401 });

export async function POST(req: Request) {
  // Closed until on-chain payment verification ships. Set REGISTRATION_OPEN=true to enable.
  if (env("REGISTRATION_OPEN") !== "true") {
    return NextResponse.json({ error: "registration_closed" }, { status: 503, headers: { "Retry-After": "3600" } });
  }
  const treasury = env("TREASURY_WALLET");
  const hasHelius = !!(env("HELIUS_API_KEY") || env("HELIUS_RPC_URL"));
  const storageOk = registryPersistent || process.env.NODE_ENV !== "production" || env("ALLOW_MEMORY_REGISTRY") === "true";
  if (!treasury || !hasHelius || !storageOk) {
    // Names only, never values.
    console.error(`[register] not_configured: TREASURY_WALLET=${!!treasury} HELIUS=${hasHelius} UPSTASH_URL=${!!env("UPSTASH_REDIS_REST_URL")} UPSTASH_TOKEN=${!!env("UPSTASH_REDIS_REST_TOKEN")} persistent_registry=${registryPersistent}`);
    return NextResponse.json({ error: "registration_closed", reason: "not_configured" }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { quote_id, signature, publicKey, payment_tx } = body ?? {};
    const parsed = parseDomain(body?.domain);
    if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
    if ([quote_id, signature, publicKey, payment_tx].some((v) => typeof v !== "string" || !v)) {
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

    const tlds = quote.tlds ?? ["teos"];
    for (const t of tlds) {
      if (await isClaimed(fullName(quote.domain, t))) return NextResponse.json({ error: "already_minted", tld: t }, { status: 401 });
    }
    // Other TLDs need the same name under .teos: in this basket, or already owned by this wallet.
    if (!tlds.includes("teos")) {
      const own = await getClaim(quote.domain);
      if (!own || own.owner !== publicKey) return NextResponse.json({ error: "teos_required", message: "Register the .teos name first." }, { status: 403 });
    }

    const pay = await verifyPayment({ txSignature: payment_tx, payer: publicKey, treasury, minLamports: quote.priceLamports });
    if (!pay.ok) {
      // Public data only (signature, addresses, amounts). No secrets.
      console.error("[register] payment_not_verified", JSON.stringify({ reason: pay.reason, payment_tx, payer: publicKey, treasury, domain: quote.domain, detail: pay.detail }));
      const status = pay.reason === "rpc_unavailable" ? 503 : 402;
      return NextResponse.json({ error: "payment_not_verified", reason: pay.reason }, { status });
    }

    // Consume the payment first, then the name. If the name was taken meanwhile, free the payment so it can be reused.
    if (!(await claimTx(payment_tx, quote.domain))) return NextResponse.json({ error: "payment_already_used" }, { status: 409 });
    const claimed: string[] = [];
    for (const t of tlds) {
      if (!(await claimDomain(fullName(quote.domain, t), publicKey, payment_tx))) {
        for (const c of claimed) await releaseDomain(c);
        await releaseTx(payment_tx);
        return NextResponse.json({ error: "already_minted", tld: t }, { status: 409 });
      }
      claimed.push(fullName(quote.domain, t));
    }
    await markUsed(quote.id);
    for (const t of tlds) {
      await incrSold(t).catch((e) => console.error("[register] counter_failed", t, String(e?.message ?? e).slice(0, 200)));
    }
    // The claims and payment are already recorded. If a mint fails, that name stays pending and is logged for a retry.
    const items: { domain: string; tld: string; asset?: string; mint_tx?: string; pending_mint: boolean }[] = [];
    for (const t of tlds) {
      let mint: { asset: string; signature: string } | null = null;
      try {
        mint = await mintTeosAsset(quote.domain, publicKey, t);
        if (mint) await recordMint(fullName(quote.domain, t), mint);
      } catch (e: any) {
        console.error("[register] mint_failed", JSON.stringify({ domain: quote.domain, tld: t, owner: publicKey, payment_tx, error: String(e?.message ?? e).slice(0, 300) }));
      }
      items.push({ domain: `${quote.domain}.${t}`, tld: t, ...(mint ? { asset: mint.asset, mint_tx: mint.signature } : {}), pending_mint: !mint });
    }
    const first = items[0];
    return NextResponse.json({
      success: true,
      pending_mint: items.some((i) => i.pending_mint),
      domain: first.domain,
      owner: publicKey,
      payment_tx,
      quote_id: quote.id,
      items,
      ...(first.asset ? { asset: first.asset, mint_tx: first.mint_tx } : {}),
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
