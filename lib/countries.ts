import { liveTlds, fullName, type Tld } from "./tlds";
import { isClaimed } from "./registry";

// Priority order first, then the rest of the live registry TLDs. "teos" itself is the base name, not a country.
const FIRST = ["eg", "sa", "ae", "qa", "kw", "us", "uk", "fr", "de", "tr", "in", "id"];

export async function remainingCountries(name: string): Promise<Tld[]> {
  const live = liveTlds().filter((t) => t.tld !== "teos");
  const rank = (t: string) => { const i = FIRST.indexOf(t); return i < 0 ? FIRST.length : i; };
  live.sort((a, b) => rank(a.tld) - rank(b.tld));
  const taken = await Promise.all(live.map((t) => isClaimed(fullName(name, t.tld)).catch(() => false)));
  return live.filter((_, i) => !taken[i]);
}
