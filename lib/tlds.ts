import teos from "../tlds/teos.json";
import eg from "../tlds/eg.json";
import sa from "../tlds/sa.json";
import ae from "../tlds/ae.json";
import qa from "../tlds/qa.json";
import kw from "../tlds/kw.json";
import bh from "../tlds/bh.json";
import om from "../tlds/om.json";

export type Tld = { tld: string; label: string; flag: string; live: boolean; promo_limit: number; promo_usd: number };

// All TLDs are Metaplex Core assets minted by the same mint key, like .teos. A TLD is sold only when live is true in tlds/<tld>.json.
export const TLDS: Tld[] = [teos, eg, sa, ae, qa, kw, bh, om] as Tld[];
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

// Registry key for a name under a TLD. .teos keeps its original key so existing claims stay valid.
export const fullName = (name: string, tld: string) => (tld === "teos" ? name : `${name}.${tld}`);
