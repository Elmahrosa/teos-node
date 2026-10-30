import { countClaimed, FOUNDER_MINTED } from "./registry";

export const EARLY_BIRD_SUPPLY = 100;
export const EARLY_BIRD_USD = 5;

let cached: { usd: number; at: number } | null = null;

export async function getLiveSolPrice(): Promise<number> {
  if (cached && Date.now() - cached.at < 60_000) return cached.usd;
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", { cache: "no-store" });
    const usd = (await r.json())?.solana?.usd;
    if (typeof usd === "number" && usd > 0) { cached = { usd, at: Date.now() }; return usd; }
  } catch {}
  if (cached) return cached.usd;
  throw new Error("sol_price_unavailable");
}

export async function totalMinted(): Promise<number> {
  return FOUNDER_MINTED + (await countClaimed());
}

export function marketPriceSol(len: number): number {
  return len === 3 ? 2.5 : len === 4 ? 1.0 : 0.2;
}

export async function priceFor(name: string) {
  const minted = await totalMinted();
  const remaining = Math.max(0, EARLY_BIRD_SUPPLY - minted);
  if (minted < EARLY_BIRD_SUPPLY && name.length >= 5) {
    const sol = await getLiveSolPrice();
    const priceSOL = Math.ceil((EARLY_BIRD_USD / sol) * 1e9) / 1e9;
    return { priceSOL, priceUSD: EARLY_BIRD_USD, isEarlyBird: true, totalMinted: minted, remaining };
  }
  return { priceSOL: marketPriceSol(name.length), priceUSD: 0, isEarlyBird: false, totalMinted: minted, remaining };
}
// USD price tiers, converted to SOL with a live rate. Fails closed: no rate, no quote.
export const PROMO_LIMIT = 100;
export const PROMO_USD = 5;
export const MARKET_USD = { long: 30, four: 150, short: 400 } as const; // 5+ letters, 4 letters, 3 letters

export type Price = { usd: number; isPromo: boolean; tier: "promo" | "market_5plus" | "premium_4" | "premium_3" };

export function priceForName(name: string, sold: number): Price {
  const len = name.toLowerCase().replace(/\.teos$/, "").trim().length;
  if (sold < PROMO_LIMIT && len >= 5) return { usd: PROMO_USD, isPromo: true, tier: "promo" };
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
