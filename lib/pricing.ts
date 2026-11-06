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
