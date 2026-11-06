import pricing from "../core/pricing.json";

// Single source of truth: core/pricing.json (tiers + tld mapping). One-time USD prices.
export const LENGTH_LABELS = ["1 char", "2 chars", "3 chars", "4 chars", "5+ chars"];

const TIERS = pricing.tiers as Record<string, number[]>;
const MAPPING = pricing.mapping as Record<string, string>;

// Display list: one entry per tier with the TLDs that map to it (generic = every other TLD).
export const PRICE_TIERS = Object.entries(TIERS).map(([id, prices]) => ({
  id,
  prices,
  tlds: id === "generic" ? null : Object.keys(MAPPING).filter((k) => MAPPING[k] === id),
}));

export function getPrice(name: string, tld: string): number {
  const t = tld.toLowerCase().trim().replace(/^\./, "");
  const tier = TIERS[MAPPING[t] ?? "generic"] ?? TIERS.generic;
  let n = name.toLowerCase().trim();
  if (n.endsWith(`.${t}`)) n = n.slice(0, -(t.length + 1));
  return tier[Math.min(Math.max(n.length, 1), 5) - 1];
}

// Live SOL/USD from public spot APIs. No fixed fallback price: a stale value is reused for at most
// 10 minutes, after that null makes the quote route answer price_unavailable.
const SOURCES: Array<[string, (j: any) => number]> = [
  ["https://api.coinbase.com/v2/prices/SOL-USD/spot", (j) => Number(j?.data?.amount)],
  ["https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", (j) => Number(j?.solana?.usd)],
  ["https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT", (j) => Number(j?.price)],
];
let cached: { v: number; at: number } | null = null;
const FRESH_MS = 10_000;
const STALE_MS = 600_000;

export async function getSolUsd(): Promise<number | null> {
  const now = Date.now();
  if (cached && now - cached.at < FRESH_MS) return cached.v;
  for (const [url, pick] of SOURCES) {
    try {
      const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
      if (!r.ok) continue;
      const v = pick(await r.json());
      if (Number.isFinite(v) && v > 1 && v < 100000) { cached = { v, at: Date.now() }; return v; }
    } catch { /* try next source */ }
  }
  return cached && now - cached.at < STALE_MS ? cached.v : null;
}

export function usdToLamports(usd: number, solUsd: number): number {
  return Math.round((usd / solUsd) * 1_000_000_000);
}

export function isValidTeosName(name: string): boolean {
  const clean = name.toLowerCase().trim().replace(/\.teos$/, "");
  if (clean.length < 1 || clean.length > 63) return false;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(clean)) return false;
  return true;
}
