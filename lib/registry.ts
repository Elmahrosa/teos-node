import { Redis } from "@upstash/redis";
import { env } from "./env";

const redis =
  env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")
    ? new Redis({ url: env("UPSTASH_REDIS_REST_URL")!, token: env("UPSTASH_REDIS_REST_TOKEN")! })
    : null;

export const registryPersistent = redis !== null;

// Fail fast when Upstash does not answer, instead of hanging the request.
function withTimeout<T>(p: Promise<T>, ms = 4000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("registry_timeout")), ms))]);
}

// In-memory fallback: per instance, resets on restart. Registration refuses to run on it in production.
const mem = new Map<string, string>();

// Atomic "set if not exists". Returns true if this call created the key.
async function setNx(key: string, value: string): Promise<boolean> {
  if (redis) return (await withTimeout(redis.set(key, value, { nx: true }))) === "OK";
  if (mem.has(key)) return false;
  mem.set(key, value);
  return true;
}
async function del(key: string) {
  if (redis) await withTimeout(redis.del(key));
  else mem.delete(key);
}
async function has(key: string): Promise<boolean> {
  if (redis) return (await withTimeout(redis.exists(key))) === 1;
  return mem.has(key);
}

const dKey = (d: string) => `teos:domain:${d.toLowerCase()}`;
const tKey = (s: string) => `teos:tx:${s}`;

export const isClaimed = (domain: string) => has(dKey(domain));
export const claimDomain = (domain: string, owner: string, tx: string) =>
  setNx(dKey(domain), JSON.stringify({ owner, tx, at: Date.now() }));
export const releaseDomain = (domain: string) => del(dKey(domain));
export const claimTx = (sig: string, domain: string) => setNx(tKey(sig), domain.toLowerCase());
export const releaseTx = (sig: string) => del(tKey(sig));

const mKey = (d: string) => `teos:mint:${d.toLowerCase()}`;

export async function getClaim(domain: string): Promise<{ owner: string; tx: string; at: number } | null> {
  const raw = redis ? await withTimeout(redis.get<unknown>(dKey(domain))) : mem.get(dKey(domain));
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : (raw as any);
}

export async function recordMint(domain: string, data: { asset: string; signature: string }) {
  const v = JSON.stringify({ ...data, at: Date.now() });
  if (redis) await withTimeout(redis.set(mKey(domain), v));
  else mem.set(mKey(domain), v);
}

// Number of names sold through the site. Incremented once per successful claim.
// One counter per TLD. .teos keeps the original key.
const soldKey = (tld: string) => (tld === "teos" ? "teos:sold" : `teos:sold:${tld}`);
export async function getSoldCount(tld = "teos"): Promise<number> {
  const k = soldKey(tld);
  if (redis) return Number((await withTimeout(redis.get<number | string>(k))) ?? 0) || 0;
  return Number(mem.get(k) ?? 0) || 0;
}
export async function incrSold(tld = "teos"): Promise<void> {
  const k = soldKey(tld);
  if (redis) await withTimeout(redis.incr(k));
  else mem.set(k, String((Number(mem.get(k) ?? 0) || 0) + 1));
// Founder names minted outside the registry (also reserved in domain-rules).
export const FOUNDER_MINTED = 2;

export async function countClaimed(): Promise<number> {
  let n = 0;
  if (redis) {
    let cursor: string | number = 0;
    do {
      const [next, keys] = (await redis.scan(cursor, { match: "teos:domain:*", count: 500 })) as [string | number, string[]];
      n += keys.length;
      cursor = next;
    } while (String(cursor) !== "0");
  } else {
    mem.forEach((_v, k) => { if (k.startsWith("teos:domain:")) n++; });
  }
  return n;
// Number of names sold through the site. Incremented once per successful claim.
const SOLD_KEY = "teos:sold";
export async function getSoldCount(): Promise<number> {
  if (redis) return Number((await withTimeout(redis.get<number | string>(SOLD_KEY))) ?? 0) || 0;
  return Number(mem.get(SOLD_KEY) ?? 0) || 0;
}
export async function incrSold(): Promise<void> {
  if (redis) await withTimeout(redis.incr(SOLD_KEY));
  else mem.set(SOLD_KEY, String((Number(mem.get(SOLD_KEY) ?? 0) || 0) + 1));
}
