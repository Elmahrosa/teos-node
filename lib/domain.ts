// Normalizes user input to the bare name: "Ayman.teos.teos" -> "ayman", "ayman.eg" -> "ayman".
export function cleanName(raw: string): string {
  let n = decodeURIComponent((raw || "").trim()).toLowerCase();
  let prev;
  do {
    prev = n;
    while (n.endsWith(".teos")) n = n.slice(0, -5);
    n = n.replace(/\.[a-z]{2}$/, "");
  } while (n !== prev);
  return n.replace(/[^a-z0-9]/g, "");
}

export function getRouteForUser(name: string, ownerWallet: string | null, connectedWallet: string | null): string {
  const clean = cleanName(name);
  if (ownerWallet && connectedWallet && ownerWallet === connectedWallet) return `/site/${clean}`;
  return `/buy/${clean}`;
}
