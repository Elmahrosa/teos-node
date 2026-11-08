import { parseDomain, isReservedWord, isNotForSaleDomain } from "./domain-rules";
import { isSealedDomain } from "./sealed";
import { isClaimed, getSoldCount } from "./registry";
import { getPriceOrNull } from "./pricing";
import { fullName } from "./tlds";

export type TldCheck = { tld: string; available: boolean; reason: string | null; price_usd: number; is_promo: boolean; sold: number };

// Checks one validated name under each TLD. Reserved and sealed names are blocked on every TLD.
export async function checkTlds(name: string, tlds: string[]): Promise<TldCheck[]> {
  const notForSale = isNotForSaleDomain(name);
  const blocked = isReservedWord(name) || isSealedDomain(name);
  return Promise.all(
    tlds.map(async (tld) => {
      const sold = await getSoldCount(tld);
      const price = getPriceOrNull(name, tld);
      // A minted name is "taken" even when it is also sealed (family names), so the UI
      // reports the truth after a founder/family mint instead of a permanent "reserved".
      const taken = await isClaimed(fullName(name, tld));
      return {
        tld,
        available: !notForSale && !blocked && !taken && price !== null,
        reason: taken ? "taken" : notForSale ? "NOT_FOR_SALE" : blocked ? "reserved" : price === null ? "price_unavailable" : null,
        price_usd: price ?? 0,
        is_promo: false,
        sold,
      };
    })
  );
}

export { parseDomain };

