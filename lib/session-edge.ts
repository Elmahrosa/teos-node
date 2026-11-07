// Edge-runtime-safe founder session check (Web Crypto only, no Node "crypto"). Used by middleware.ts.
// Must stay byte-compatible with signSession()/verifySession() in lib/founderAuth.ts.
export const SESSION_COOKIE_PROD = "__Host-founder-auth";
export const SESSION_COOKIE_DEV = "founder-auth";
export const SESSION_DOMAIN = "founder.v1:";

export function readSessionCookie(cookieHeader: string | null): string | null {
  const m = /(?:^|;\s*)(?:__Host-)?founder-auth=([^;]+)/.exec(cookieHeader || "");
  return m ? m[1] : null;
}

function hex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function verifySessionEdge(cookieHeader: string | null, secret: string, nowSec = Date.now() / 1000): Promise<boolean> {
  if (!secret || secret.length < 32) return false;
  const raw = readSessionCookie(cookieHeader);
  if (!raw) return false;
  let decoded: string;
  try { decoded = decodeURIComponent(raw); } catch { return false; }
  const [exp, mac] = decoded.split(".");
  if (!exp || !mac || !/^\d+$/.test(exp) || Number(exp) < nowSec) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(SESSION_DOMAIN + exp));
  return safeEqual(hex(sig), mac);
}