export const RESERVED_WORDS = ["ayman","elmahrosa","teos","admin","api","www","mail","root","support","web4","app","test","nft","solana"];

export type DomainCheck =
  | { ok: true; domain: string }
  | { ok: false; status: number; body: Record<string, unknown> };

// Validates raw user input. Lowercases first; never throws.
export function parseDomain(raw: unknown): DomainCheck {
  const domain = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!domain) return { ok: false, status: 400, body: { error: "domain required" } };
  if (domain.length > 30) return { ok: false, status: 400, body: { error: "domain_too_long" } };
  if (!/^[a-z0-9-]{3,30}$/.test(domain)) {
    return { ok: false, status: 400, body: { error: "invalid_format", message: "only lowercase a-z, 0-9, hyphen, 3-30 chars" } };
  }
  return { ok: true, domain };
}

export function isReservedWord(domain: string): boolean {
  return RESERVED_WORDS.includes(domain.toLowerCase());
}
