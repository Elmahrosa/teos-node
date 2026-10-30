import { parseDomain, isReservedWord } from "./domain-rules";
import { isSealedDomain } from "./sealed";
import { isClaimed, getSoldCount } from "./registry";
import { priceForName } from "./pricing";
import { fullName, getTld } from "./tlds";

export type TldCheck = { tld: string; available: boolean; reason: string | null; price_usd: number; is_promo: boolean; sold: number };

// Checks one validated name under each TLD. Reserved and sealed names are blocked on every TLD.
export async function checkTlds(name: string, tlds: string[]): Promise<TldCheck[]> {
  const blocked = isReservedWord(name) || isSealedDomain(name);
  return Promise.all(
    tlds.map(async (tld) => {
      const sold = await getSoldCount(tld);
      const price = priceForName(name, sold, getTld(tld)?.promo_limit);
      const taken = blocked ? false : await isClaimed(fullName(name, tld));
      return {
        tld,
        available: !blocked && !taken,
        reason: blocked ? "reserved" : taken ? "taken" : null,
        price_usd: price.usd,
        is_promo: price.isPromo,
        sold,
      };
    })
  );
}

export { parseDomain };
