import data from "../data/reserved.json";

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t" };

const strip = (s: string) => s.toLowerCase().replace(/[-_.\s]/g, "");
const leet = (s: string) => s.replace(/[013457]/g, (c) => LEET[c] ?? c);
const noTrailingDigits = (s: string) => s.replace(/\d+$/, "");

type List = { contains: string[]; exact: string[]; affix: string[] };
const list = data as unknown as List;
const hasDigit = (w: string) => /\d/.test(w);

// Words that contain a digit (5ara, 3ars) are matched literally; plain-letter words also match the leet-decoded input.
function forms(name: string, word: string): string[] {
  const s = strip(name);
  return hasDigit(word) ? [s] : [s, leet(s)];
}

export const BLOCKED_MESSAGE = "Name is reserved, not available for sale";

// True when the name must never be sold, on any TLD. Never throws.
export function isBlockedName(rawName: string): boolean {
  if (typeof rawName !== "string" || !rawName) return false;
  const base = rawName.split(".")[0];
  for (const w of list.contains) if (forms(base, w).some((f) => f.includes(strip(w)))) return true;
  for (const w of list.exact) {
    const ws = strip(w);
    if (forms(base, w).some((f) => f === ws || noTrailingDigits(f) === ws)) return true;
  }
  for (const w of list.affix) {
    const ws = strip(w);
    if (forms(base, w).some((f) => { const t = noTrailingDigits(f); return t.startsWith(ws) || t.endsWith(ws); })) return true;
  }
  return false;
}
