import fs from "fs";
import path from "path";
const reservedPath = path.join(process.cwd(), "domains", "reserved-list.json");
export function checkDomain(domain: string) {
  try {
    const reserved = JSON.parse(fs.readFileSync(reservedPath, "utf8"));
    const upper = domain.toUpperCase();
    if (reserved[upper]) {
      return { domain: upper, status: "RESERVED", owner: reserved[upper].owner, message: "RESERVED - OWNER ONLY" };
    }
  } catch {}
  return { domain, status: "AVAILABLE_FOR_MINT", message: "AVAILABLE" };
}
export const isReserved = (d: string) => {
  try {
    const reserved = JSON.parse(fs.readFileSync(reservedPath, "utf8"));
    return !!reserved[d.toUpperCase()];
  } catch { return false; }
};
export const getQuote = (d: string) => ({ domain: d, price: 5 });
export const getStats = () => ({ total: 9 });