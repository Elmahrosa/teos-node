import { Redis } from "@upstash/redis";
import { env } from "./env";
import { sanitizeSite, type SiteConfig, type StoredSite } from "./sites";

const redis =
  env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")
    ? new Redis({ url: env("UPSTASH_REDIS_REST_URL")!, token: env("UPSTASH_REDIS_REST_TOKEN")! })
    : null;
const mem = new Map<string, string>();
const key = (name: string) => `teos:site:${name}`;

export async function getSite(name: string): Promise<StoredSite | null> {
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
  const stored: StoredSite = { ...cfg, owner, updatedAt: Date.now() };
  const json = JSON.stringify(stored);
  if (redis) await redis.set(key(name), json);
  else mem.set(key(name), json);
  return stored;
}

