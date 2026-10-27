import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
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
