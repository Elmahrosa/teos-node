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
