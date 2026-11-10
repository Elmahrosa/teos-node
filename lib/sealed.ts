import sealedNames from "../domains/sealed-list.json";
import reservedData from "../domains/reserved-list.json";
import banks from "../domains/central-banks-reserve.json";
import protectedHashes from "../domains/protected-hashes.json";
import { sha256Hex } from "./sha256";

// Every name with a file in domains/*.teos.json is sealed: never for sale.
// Regenerate domains/sealed-list.json when adding a file to domains/.
const sealed = new Set<string>((sealedNames as string[]).map(norm));

// Reserved institutional names are auction-only: never sold through the public flow.
// NOTE: hashes only hide names from casual reading. They are NOT cryptographic protection for short or guessable names
// (anyone can hash a dictionary of candidates). Treat this as obfuscation, not secrecy.
// The real names are kept out of the public repo; they are matched by SHA-256 hash (domains/protected-hashes.json).
const protectedSet = new Set<string>((protectedHashes as { sha256: string[] }).sha256);
(function walk(o: any) {
  if (Array.isArray(o)) o.forEach(walk);
  else if (o && typeof o === "object") {
    if (typeof o.domain === "string") sealed.add(norm(o.domain));
    Object.values(o).forEach(walk);
  }
})(banks);
// Vault spelling (vault/AMIRA.TEOS.json); reserved-list.json spells it AMEIRA.
sealed.add("AMIRA");

function norm(d: string) { return d.toUpperCase().trim().replace(/\.TEOS$/, ""); }

export function isSealedDomain(domain: string): boolean {
  const n = norm(domain);
  if (sealed.has(n)) return true;
  if (protectedSet.has(sha256Hex(n))) return true;
  const d = reservedData as any;
  if (d[`${n}.TEOS`]) return true;
  return [...(d.premium_global || []), ...(d.brothers || []), ...(d.sisters || []), ...(d.premium_eg || []), d.owner || ""]
    .some((x: string) => norm(x) === n);
}
