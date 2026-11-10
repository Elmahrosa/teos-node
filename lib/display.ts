// User-visible names use the SHORT form (AYMAN.EG) with an "inside TEOS" badge next to it (components/InsideTeos.tsx).
// The full form NAME.EG.TEOS is the canonical technical name only and must never be rendered in the UI.
export const displayName = (name: string, tld: string): string => `${name}.${tld}`;
export const canonicalName = (name: string, tld: string): string =>
  tld === "teos" ? `${name}.teos` : `${name}.${tld}.teos`;
export const needsBadge = (tld: string): boolean => tld !== "teos";
