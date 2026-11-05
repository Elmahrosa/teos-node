export const MARKET_USD = 10;

export async function getSolUsd(): Promise<number> {
  return 150;
}

export function usdToLamports(usd: number, solUsd: number = 150): number {
  return Math.round((usd / solUsd) * 1_000_000_000);
}

export function priceForName(name: string, soldCount: number = 0): { usd: number; isPromo: boolean } {
  const len = name.trim().length;
  let usd = 30;
  if (len === 1) usd = 2000;
  else if (len === 2) usd = 400;
  else if (len === 3) usd = 400;
  else if (len === 4) usd = 150;
  return { usd, isPromo: false };
}
