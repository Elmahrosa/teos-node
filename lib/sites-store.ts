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

// ---- Static snapshot (IPFS-ready copy) -------------------------------------------------------
// Kept in its own key: it holds rendered HTML, and it must never leak into the public site JSON
// through sanitizeSite(), which only knows the config fields.
export type SiteSnapshot = {
  cid: string; // CIDv1 raw of `html`
  sha256: string; // hex sha256 of `html`
  bytes: number; // UTF-8 length of `html`
  signed: boolean; // true when the owner's signature covered `cid`
  at: number; // signature timestamp used at publish
  signer: string; // wallet that published
  html: string;
};

const snapKey = (name: string) => `teos:snapshot:${name}`;
const SNAPSHOT_MAX_CHARS = 200_000;

export async function saveSnapshot(name: string, snap: SiteSnapshot): Promise<void> {
  assertStoreAvailable();
  if (snap.html.length > SNAPSHOT_MAX_CHARS) throw new Error("snapshot_too_large");
  const json = JSON.stringify(snap);
  if (redis) await redis.set(snapKey(name), json);
  else mem.set(snapKey(name), json);
}

export async function getSnapshot(name: string): Promise<SiteSnapshot | null> {
  assertStoreAvailable();
  const raw = redis ? await redis.get<unknown>(snapKey(name)) : mem.get(snapKey(name));
  if (!raw) return null;
  try {
    const o: any = typeof raw === "string" ? JSON.parse(raw) : raw;
    const html = typeof o?.html === "string" ? o.html : "";
    if (!html || html.length > SNAPSHOT_MAX_CHARS) return null;
    if (typeof o?.cid !== "string" || typeof o?.sha256 !== "string") return null;
    return {
      cid: o.cid,
      sha256: o.sha256,
      bytes: Number(o.bytes) || 0,
      signed: o.signed === true,
      at: Number(o.at) || 0,
      signer: String(o.signer ?? ""),
      html,
    };
  } catch {
    return null;
  }
}
