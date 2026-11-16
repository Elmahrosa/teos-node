import { Redis } from "@upstash/redis";
import { env } from "./env";
import { sanitizeSite, type SiteConfig, type StoredSite } from "./sites";

const redis =
  env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")
    ? new Redis({ url: env("UPSTASH_REDIS_REST_URL")!, token: env("UPSTASH_REDIS_REST_TOKEN")! })
    : null;
const mem = new Map<string, string>();
const key = (name: string) => `teos:site:${name}`;

export const SITE_STORE_UNAVAILABLE = "site_store_unavailable";

// Published sites are durable data: in production a missing Upstash config must fail loudly
// instead of falling back to per-instance memory, where sites would vanish on restart and
// be missing on every other instance. Development keeps the in-memory fallback.
function assertStoreAvailable(): void {
  if (!redis && process.env.NODE_ENV === "production") throw new Error(SITE_STORE_UNAVAILABLE);
}

export function isSiteStoreUnavailable(err: unknown): boolean {
  return err instanceof Error && err.message === SITE_STORE_UNAVAILABLE;
}

export async function getSite(name: string): Promise<StoredSite | null> {
  assertStoreAvailable();
  const raw = redis ? await redis.get<unknown>(key(name)) : mem.get(key(name));
  if (!raw) return null;
  try {
    const o: any = typeof raw === "string" ? JSON.parse(raw) : raw;
    return { ...sanitizeSite(o), owner: String(o.owner ?? ""), updatedAt: Number(o.updatedAt) || 0 };
  } catch {
    return null;
  }
}

export async function saveSite(name: string, owner: string, cfg: SiteConfig): Promise<StoredSite> {
  assertStoreAvailable();
  const stored: StoredSite = { ...cfg, owner, updatedAt: Date.now() };
  const json = JSON.stringify(stored);
  if (redis) await redis.set(key(name), json);
  else mem.set(key(name), json);
  return stored;
}
