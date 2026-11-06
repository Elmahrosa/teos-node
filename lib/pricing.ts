export const MARKET_USD = 10;

export async function getSolUsd(): Promise<number> {
  return 150;
}

export function usdToLamports(usd: number, solUsd: number = 150): number {
  return Math.round((usd / solUsd) * 1_000_000_000);
}

export function getTeosPrice(name: string): number {
  const clean = name.toLowerCase().trim().replace(/\.teos$/, "");
  const len = clean.length;
  if (len === 1) return 2000;
  if (len === 2) return 600;
  if (len === 3) return 180;
  if (len === 4) return 80;
  return 30;
}

export function isValidTeosName(name: string): boolean {
  const clean = name.toLowerCase().trim().replace(/\.teos$/, "");
  if (clean.length < 1 || clean.length > 63) return false;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(clean)) return false;
  return true;
}

export function priceForName(name: string, soldCount: number = 0): { usd: number; isPromo: boolean } {
  return { usd: getTeosPrice(name), isPromo: false };
}
