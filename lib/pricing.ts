// USD price tiers, converted to SOL with a live rate. Fails closed: no rate, no quote.
export const PROMO_LIMIT = 100;
export const PROMO_USD = 5;
export const MARKET_USD = { long: 30, four: 150, short: 400 } as const; // 5+ letters, 4 letters, 3 letters

export type Price = { usd: number; isPromo: boolean; tier: "promo" | "market_5plus" | "premium_4" | "premium_3" };

export function priceForName(name: string, sold: number, promoLimit = PROMO_LIMIT): Price {
  const len = name.toLowerCase().replace(/\.teos$/, "").trim().length;
  if (sold < promoLimit && len >= 5) return { usd: PROMO_USD, isPromo: true, tier: "promo" };
  if (len <= 3) return { usd: MARKET_USD.short, isPromo: false, tier: "premium_3" };
  if (len === 4) return { usd: MARKET_USD.four, isPromo: false, tier: "premium_4" };
  return { usd: MARKET_USD.long, isPromo: false, tier: "market_5plus" };
}

let cached: { usd: number; at: number } | null = null;
const FRESH_MS = 60_000;
const STALE_OK_MS = 15 * 60_000; // a rate this old is still used if the API is down

// Returns USD per SOL, or null if no recent rate is available.
export async function getSolUsd(): Promise<number | null> {
  const now = Date.now();
  if (cached && now - cached.at < FRESH_MS) return cached.usd;
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    const j = await r.json();
    const usd = Number(j?.solana?.usd);
    if (r.ok && usd > 1 && usd < 100000) {
      cached = { usd, at: now };
      return usd;
    }
  } catch {}
  return cached && now - cached.at < STALE_OK_MS ? cached.usd : null;
}

export const usdToLamports = (usd: number, solUsd: number) => Math.ceil((usd / solUsd) * 1e9);
