import all from "../tlds/all.json";

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

// Sales are limited to these TLDs. Every other TLD is blocked for quote, register and mint until it is deliberately added here.
export const SALE_TLDS: readonly string[] = ["teos"];
export const isSaleTld = (t: string) => SALE_TLDS.includes(t.toLowerCase());

// Raw tlds input ("eg", "teos,eg" or an array) to lowercase strings, without validating them. undefined means ["teos"].
export function requestedTlds(raw: unknown): string[] {
  if (raw === undefined || raw === null) return ["teos"];
  const list = (Array.isArray(raw) ? raw.join(",") : typeof raw === "string" ? raw : "")
    .split(",").map((s) => s.trim().toLowerCase().replace(/^\./, "")).filter(Boolean);
  return list.length ? list : ["__invalid__"];
}

// Registry key for a name under a TLD. .teos keeps its original key so existing claims stay valid.
export const fullName = (name: string, tld: string) => (tld === "teos" ? name : `${name}.${tld}`);
