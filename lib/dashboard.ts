import reservedData from "../domains/reserved-list.json";
import { isSealedDomain } from "./sealed";
import { isClaimed } from "./registry";
import { getPrice } from "./pricing";
import { isNotForSaleDomain, isReservedWord } from "./domain-rules";
import { TLDS, fullName } from "./tlds";

export type TldStatus = "owned" | "available" | "reserved";
export type TldRow = { tld: string; flag: string; label: string; domain: string; price_usd: number; status: TldStatus };

function inReservedList(domainUpper: string): boolean {
  const data: any = reservedData;
  if (data[domainUpper]) return true;
  if (data.owner && String(data.owner).toUpperCase() === domainUpper) return true;
  const lists = [...(data.premium_global || []), ...(data.brothers || []), ...(data.sisters || []), ...(data.premium_eg || [])];
  return lists.some((d: string) => String(d).toUpperCase() === domainUpper);
}

// Every protected name is "reserved" on every TLD, so a founder name never shows as available.
export function isProtectedName(name: string): boolean {
  return isNotForSaleDomain(name) || isReservedWord(name) || isSealedDomain(name.toUpperCase()) || isSealedDomain(name) || inReservedList(name.toUpperCase());
}

// One row per TLD in tlds/all.json for an already validated name. Price comes only from the public table.
export async function buildTldRows(name: string): Promise<TldRow[]> {
  const protectedName = isProtectedName(name);
  return Promise.all(
    TLDS.map(async (t) => {
      let status: TldStatus;
      if (protectedName || !t.live) status = "reserved";
      else status = (await isClaimed(fullName(name, t.tld)).catch(() => true)) ? "owned" : "available";
      return { tld: t.tld, flag: t.flag, label: t.label, domain: `${name}.${t.tld}`, price_usd: getPrice(name, t.tld), status };
    })
  );
}

export const DASHBOARD_MAX_AGE_MS = 300_000;
export const dashboardMessage = (name: string, ts: number) => `teos://dashboard/${name}/${ts}`;
