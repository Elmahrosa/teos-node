import { Redis } from "@upstash/redis";
import { env } from "./env";

const redis =
  env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")
    ? new Redis({ url: env("UPSTASH_REDIS_REST_URL")!, token: env("UPSTASH_REDIS_REST_TOKEN")! })
    : null;

export const registryPersistent = redis !== null;

// In-memory fallback: per instance, resets on restart. Registration refuses to run on it in production.
const mem = new Map<string, string>();

// Atomic "set if not exists". Returns true if this call created the key.
async function setNx(key: string, value: string): Promise<boolean> {
  if (redis) return (await redis.set(key, value, { nx: true })) === "OK";
  if (mem.has(key)) return false;
  mem.set(key, value);
  return true;
}
async function del(key: string) {
  if (redis) await redis.del(key);
  else mem.delete(key);
}
async function has(key: string): Promise<boolean> {
  if (redis) return (await redis.exists(key)) === 1;
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
  const raw = redis ? await redis.get<unknown>(dKey(domain)) : mem.get(dKey(domain));
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : (raw as any);
}

export async function recordMint(domain: string, data: { asset: string; signature: string }) {
  const v = JSON.stringify({ ...data, at: Date.now() });
  if (redis) await redis.set(mKey(domain), v);
  else mem.set(mKey(domain), v);
}

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
}
