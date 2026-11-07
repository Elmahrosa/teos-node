// Content-Security-Policy builder. Nonce-based: inline scripts run only with the per-request nonce,
// and 'strict-dynamic' lets those trusted scripts load their own chunks. No 'unsafe-eval' in production.
export function buildCsp(nonce: string, dev = false): string {
  const script = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(dev ? ["'unsafe-eval'"] : [])];
  const d: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": script,
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    // Wallet adapters and WalletConnect talk to many RPC / relay hosts, so connections stay https/wss only.
    "connect-src": ["'self'", "https:", "wss:", ...(dev ? ["ws:", "http://localhost:*"] : [])],
    "frame-src": ["'self'", "https://verify.walletconnect.com", "https://verify.walletconnect.org"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'self'"],
  };
  const parts = Object.entries(d).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (!dev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}