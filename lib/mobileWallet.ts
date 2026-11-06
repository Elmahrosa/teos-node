// Mobile wallet deep links. On mobile Chrome none of the desktop wallet extensions exist, so we open the
// wallet app with a deep link that loads this site inside the wallet's in-app browser, where the wallet
// is injected and `?connect=<id>` makes the site connect straight away.
export type WalletId = "phantom" | "solflare" | "trust";

export const MOBILE_WALLETS: Record<WalletId, { label: string; adapterName: string; pkg: string; browse: (url: string, ref: string) => { https: string; host: string; path: string } }> = {
  phantom: {
    label: "Phantom", adapterName: "Phantom", pkg: "app.phantom",
    browse: (url, ref) => ({ https: `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(ref)}`, host: "phantom.app", path: `/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(ref)}` }),
  },
  solflare: {
    label: "Solflare", adapterName: "Solflare", pkg: "com.solflare.mobile",
    browse: (url, ref) => ({ https: `https://solflare.com/ul/v1/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(ref)}`, host: "solflare.com", path: `/ul/v1/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(ref)}` }),
  },
  trust: {
    label: "Trust Wallet", adapterName: "Trust", pkg: "com.wallet.crypto.trustapp",
    browse: (url) => ({ https: `https://link.trustwallet.com/open_url?coin_id=501&url=${encodeURIComponent(url)}`, host: "link.trustwallet.com", path: `/open_url?coin_id=501&url=${encodeURIComponent(url)}` }),
  },
};

export const playStoreUrl = (id: WalletId) => `https://play.google.com/store/apps/details?id=${MOBILE_WALLETS[id].pkg}`;

export const isMobileBrowser = () => typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent);
export const isAndroid = () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

// True inside a wallet's in-app browser (or with an extension): a Solana provider is already injected.
export function hasInjectedWallet(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return !!(w.phantom?.solana?.isPhantom || w.solana?.isPhantom || w.solflare?.isSolflare || w.trustwallet?.solana || w.trustWallet?.solana || w.backpack || w.glow);
}

// URL the wallet's in-app browser should load. `connect` tells the site to connect on arrival.
export function siteUrlFor(id: WalletId): string {
  const u = new URL(location.href);
  u.searchParams.set("connect", id);
  return u.toString();
}

// Android: an intent pinned to the wallet's package, with the Play Store page as the fallback. If the wallet is
// installed it opens at once (Phantom: https://phantom.app/ul/browse/<site>); if not, Chrome opens the store page.
// iOS: the wallet's universal link, which opens the app, or the wallet's own install page when it is missing.
export function walletLaunchHref(id: WalletId): string {
  const w = MOBILE_WALLETS[id];
  const l = w.browse(siteUrlFor(id), location.origin);
  return isAndroid() ? `intent://${l.host}${l.path}#Intent;scheme=https;package=${w.pkg};S.browser_fallback_url=${encodeURIComponent(playStoreUrl(id))};end` : l.https;
}

export const needsDeepLink = () => isMobileBrowser() && !hasInjectedWallet();

// Must run inside the tap handler: Chrome only follows an intent that comes from a user gesture.
export function launchWallet(id: WalletId) {
  window.location.href = walletLaunchHref(id);
}

// Which deep-linked wallet a modal row is, by its visible name.
export function walletIdFromLabel(label: string): WalletId | null {
  const t = label.trim().toLowerCase();
  if (t.startsWith("phantom")) return "phantom";
  if (t.startsWith("solflare")) return "solflare";
  if (t.startsWith("trust")) return "trust";
  return null;
}
