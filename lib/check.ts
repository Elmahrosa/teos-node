import { parseDomain, isReservedWord, isNotForSaleDomain } from "./domain-rules";
import { isSealedDomain } from "./sealed";
import { isClaimed, getSoldCount } from "./registry";
import { priceForName } from "./pricing";
import { fullName } from "./tlds";

export type TldCheck = { tld: string; available: boolean; reason: string | null; price_usd: number; is_promo: boolean; sold: number };

// Checks one validated name under each TLD. Reserved and sealed names are blocked on every TLD.
export async function checkTlds(name: string, tlds: string[]): Promise<TldCheck[]> {
  const notForSale = isNotForSaleDomain(name);
  const blocked = isReservedWord(name) || isSealedDomain(name);
  return Promise.all(
    tlds.map(async (tld) => {
      const sold = await getSoldCount(tld);
      const price = priceForName(name, sold);
      const taken = blocked ? false : await isClaimed(fullName(name, tld));
      return {
        tld,
        available: !notForSale && !blocked && !taken,
        reason: notForSale ? "NOT_FOR_SALE" : blocked ? "reserved" : taken ? "taken" : null,
        price_usd: price.usd,
        is_promo: price.isPromo,
        sold,
      };
    })
  );
}

export { parseDomain };
