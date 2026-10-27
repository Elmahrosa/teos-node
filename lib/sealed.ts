import sealedNames from "../domains/sealed-list.json";
import reservedData from "../domains/reserved-list.json";

// Every name with a file in domains/*.teos.json is sealed: never for sale.
// Regenerate domains/sealed-list.json when adding a file to domains/.
const sealed = new Set<string>((sealedNames as string[]).map(norm));

function norm(d: string) { return d.toUpperCase().trim().replace(/\.TEOS$/, ""); }

export function isSealedDomain(domain: string): boolean {
  const n = norm(domain);
  if (sealed.has(n)) return true;
  const d = reservedData as any;
  if (d[`${n}.TEOS`]) return true;
  return [...(d.premium_global || []), ...(d.brothers || []), ...(d.sisters || []), ...(d.premium_eg || []), d.owner || ""]
    .some((x: string) => norm(x) === n);
}
