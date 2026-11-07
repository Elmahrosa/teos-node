import all from "../tlds/all.json";
import { getPriceOrNull } from "./pricing";

export type Tld = { tld: string; label: string; flag: string; live: boolean; name?: string; region?: string };

// All TLDs are Metaplex Core assets minted by the same mint key, like .teos. A TLD is sold only when live is true in tlds/<tld>.json.
export const TLDS: Tld[] = all as Tld[];
export const liveTlds = () => TLDS.filter((t) => t.live);
export const getTld = (t: string) => TLDS.find((x) => x.tld === t.toLowerCase());

// Parses "teos,eg,sa": keeps live, known, unique TLDs. Returns null on any unknown or not-live value.
export function parseTlds(raw: unknown): string[] | null {
  const list = (Array.isArray(raw) ? raw.join(",") : typeof raw === "string" ? raw : "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!list.length || list.length > 8) return null;
  const out: string[] = [];
  for (const t of list) {
    const d = getTld(t);
    if (!d || !d.live) return null;
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

// A TLD is for sale when it is live in tlds/all.json AND has an explicit price tier in core/pricing.json.
// A live TLD without a price is never sold (see getPriceOrNull: there is no default tier).
export const isSaleTld = (t: string) => {
  const d = getTld(String(t));
  return !!d && d.live && getPriceOrNull("abcde", d.tld) !== null;
};
export const SALE_TLDS: readonly string[] = TLDS.filter((x) => isSaleTld(x.tld)).map((x) => x.tld);

// Raw tlds input ("eg", "teos,eg" or an array) to lowercase strings, without validating them. undefined means ["teos"].
export function requestedTlds(raw: unknown): string[] {
  if (raw === undefined || raw === null) return ["teos"];
  const list = (Array.isArray(raw) ? raw.join(",") : typeof raw === "string" ? raw : "")
    .split(",").map((s) => s.trim().toLowerCase().replace(/^\./, "")).filter(Boolean);
  return list.length ? list : ["__invalid__"];
}

// Registry key for a name under a TLD. .teos keeps its original key so existing claims stay valid.
export const fullName = (name: string, tld: string) => (tld === "teos" ? name : `${name}.${tld}`);
