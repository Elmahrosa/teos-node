import pricing from "../core/pricing.json";

// Single source of truth: core/pricing.json. All prices are one-time USD, no renewal.
export type PriceTier = { id: string; tlds: string[] | "*"; prices: number[] };
export const PRICE_TIERS = pricing.tiers as PriceTier[];
export const PAYMENT_LABEL: string = pricing.payment;
export const LENGTH_LABELS: string[] = pricing.lengths;

const GENERIC = PRICE_TIERS.find((t) => t.tlds === "*")!;
const BY_TLD = new Map<string, PriceTier>();
for (const t of PRICE_TIERS) if (Array.isArray(t.tlds)) for (const x of t.tlds) BY_TLD.set(x, t);

export function tierForTld(tld: string): PriceTier {
  return BY_TLD.get(tld.toLowerCase().trim().replace(/^\./, "")) ?? GENERIC;
}

export function getPrice(name: string, tld: string): number {
  const t = tld.toLowerCase().trim().replace(/^\./, "");
  let n = name.toLowerCase().trim();
  if (n.endsWith(`.${t}`)) n = n.slice(0, -(t.length + 1));
  const len = n.length;
  const prices = tierForTld(t).prices;
  return prices[Math.min(Math.max(len, 1), 5) - 1];
}

export async function getSolUsd(): Promise<number> {
  return 150;
}

export function usdToLamports(usd: number, solUsd: number = 150): number {
  return Math.round((usd / solUsd) * 1_000_000_000);
}

export function isValidTeosName(name: string): boolean {
  const clean = name.toLowerCase().trim().replace(/\.teos$/, "");
  if (clean.length < 1 || clean.length > 63) return false;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(clean)) return false;
  return true;
}
