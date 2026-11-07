import { env } from "./env";

// CSRF guard for cookie-authenticated state changes: the request must come from our own origin.
export function sameOrigin(req: Request): boolean {
  const allowed = new Set<string>();
  for (const h of [req.headers.get("x-forwarded-host"), req.headers.get("host")]) if (h) allowed.add(h.toLowerCase());
  const base = env("PUBLIC_BASE_URL");
  if (base) { try { allowed.add(new URL(base).host.toLowerCase()); } catch { /* ignore */ } }
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") === "same-origin";
  try { return allowed.has(new URL(origin).host.toLowerCase()); } catch { return false; }
}