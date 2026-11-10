// Display-only label for a name under a namespace. Country namespaces always render in the full form
// (NAME.EG.TEOS) so they are never mistaken for an official country domain. Registry keys use fullName() in lib/tlds.ts.
export const displayName = (name: string, tld: string): string =>
  tld === "teos" ? `${name}.teos` : `${name}.${tld}.teos`;
