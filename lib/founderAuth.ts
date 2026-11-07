import crypto from "crypto";
import { env } from "./env";
import { SESSION_COOKIE_DEV, SESSION_COOKIE_PROD, SESSION_DOMAIN, readSessionCookie } from "./session-edge";

const isProd = () => process.env.NODE_ENV === "production";
export const sessionCookieName = () => (isProd() ? SESSION_COOKIE_PROD : SESSION_COOKIE_DEV);
export const sessionCookieSecure = () => isProd();

const secret = () => env("FOUNDER_SESSION_SECRET") ?? "";
// A short session secret is treated as "not configured" (fail closed).
export const sessionSecretOk = () => secret().length >= 32;
const mac = (exp: string) => crypto.createHmac("sha256", secret()).update(SESSION_DOMAIN + exp).digest("hex");

export function signSession(maxAgeSec = 604800) {
  const exp = String(Math.floor(Date.now() / 1000) + maxAgeSec);
  return `${exp}.${mac(exp)}`;
}

export function verifySession(cookieHeader: string | null): boolean {
  if (!sessionSecretOk()) return false;
  const raw = readSessionCookie(cookieHeader);
  if (!raw) return false;
  let decoded: string;
  try { decoded = decodeURIComponent(raw); } catch { return false; }
  const [exp, m] = decoded.split(".");
  if (!exp || !m || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  const a = Buffer.from(m), b = Buffer.from(mac(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- Password hashing: scrypt (Node built-in, memory-hard, per-install random salt) ----
// Stored as  scrypt$N$r$p$<salt b64>$<hash b64>   in FOUNDER_PASSWORD_HASH. Generate with: node scripts/hash-password.mjs
const KEYLEN = 64;
const MAXMEM = 256 * 1024 * 1024;

function scryptAsync(pw: string, salt: Buffer, N: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    crypto.scrypt(pw, salt, KEYLEN, { N, r, p, maxmem: MAXMEM }, (err, key) => (err ? reject(err) : resolve(key)))
  );
}

export async function hashPassword(pw: string, params = { N: 65536, r: 8, p: 1 }): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scryptAsync(pw, salt, params.N, params.r, params.p);
  return `scrypt$${params.N}$${params.r}$${params.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPasswordHash(pw: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]), r = Number(parts[2]), p = Number(parts[3]);
  if (![N, r, p].every(Number.isInteger) || N < 2 ** 14 || N > 2 ** 18 || r < 1 || r > 16 || p < 1 || p > 4) return false;
  const salt = Buffer.from(parts[4], "base64");
  const want = Buffer.from(parts[5], "base64");
  if (salt.length < 16 || want.length !== KEYLEN) return false;
  const got = await scryptAsync(pw, salt, N, r, p);
  return crypto.timingSafeEqual(got, want);
}

export function passwordConfigured(): boolean {
  return !!(env("FOUNDER_PASSWORD_HASH") || env("FOUNDER_PASSWORD"));
}

export function founderLoginConfigured(): boolean {
  return passwordConfigured() && sessionSecretOk();
}

// One scrypt at a time: caps memory use if many login attempts arrive together.
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}

export function passwordOk(input: string): Promise<boolean> {
  return serial(async () => {
    const hash = env("FOUNDER_PASSWORD_HASH");
    if (hash) return verifyPasswordHash(input, hash);
    // Legacy fallback while FOUNDER_PASSWORD_HASH is not set yet. Plaintext in env: migrate off it.
    const legacy = env("FOUNDER_PASSWORD");
    if (!legacy) return false;
    const k = crypto.randomBytes(32);
    const d = (s: string) => crypto.createHmac("sha256", k).update(s).digest();
    return crypto.timingSafeEqual(d(input), d(legacy));
  });
}