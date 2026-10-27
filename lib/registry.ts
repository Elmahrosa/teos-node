// In-memory claim registry. Per instance; resets on restart. Replaced by a persistent store in the payment PR.
const claims = new Map<string, string>();

export function isClaimed(domain: string): boolean {
  return claims.has(domain.toLowerCase());
}

export function claim(domain: string, owner: string): void {
  claims.set(domain.toLowerCase(), owner);
}
