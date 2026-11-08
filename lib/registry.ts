
import { Redis } from "@upstash/redis";
import { env } from "./env";
import { isNotForSaleDomain, isReservedWord } from "./domain-rules";
import { isSealedDomain } from "./sealed";
import { fullName } from "./tlds";

const redis =
  env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")
    ? new Redis({
        url: env("UPSTASH_REDIS_REST_URL")!,
        token: env("UPSTASH_REDIS_REST_TOKEN")!,
      })
    : null;

export const registryPersistent = redis !== null;

// Fail fast when Upstash does not answer.
function withTimeout<T>(p: Promise<T>, ms = 4000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("registry_timeout")), ms)
    ),
  ]);
}

// In-memory fallback: per instance, resets on restart.
const mem = new Map<string, string>();

// Atomic "set if not exists". exSec = null means the key never expires.
async function setNx(key: string, value: string, exSec: number | null = 900): Promise<boolean> {
  if (redis) {
    const opts = exSec === null ? { nx: true as const } : { nx: true as const, ex: exSec };
    return (await withTimeout(redis.set(key, value, opts))) === "OK";
  }

  if (mem.has(key)) return false;

  mem.set(key, value);
  if (exSec !== null) setTimeout(() => mem.delete(key), exSec * 1000).unref?.();
  return true;
}

async function has(key: string): Promise<boolean> {
  if (redis) {
    return (await withTimeout(redis.exists(key))) === 1;
  }

  return mem.has(key);
}

const mKey = (domain: string) => `teos:mint:${domain.toLowerCase()}`;
const dKey = (domain: string) => `teos:domain:${domain.toLowerCase()}`;
const tKey = (signature: string) => `teos:tx:${signature}`;

function baseName(domain: string): string {
  return domain.trim().toLowerCase().split(".")[0];
}

// Central policy: every claim path enforces protected-name rules.
function isBlockedDomain(domain: string): boolean {
  const base = baseName(domain);

  return (
    !base ||
    isNotForSaleDomain(domain) ||
    isReservedWord(base) ||
    isSealedDomain(base)
  );
}

// A name is taken if it has a claim OR a mint record. Both are permanent, so a sold name stays claimed forever.
export const isClaimed = async (domain: string) => (await has(dKey(domain))) || (await has(mKey(domain)));

export async function claimDomain(
  domain: string,
  owner: string,
  tx: string
): Promise<boolean> {
  if (isBlockedDomain(domain)) return false;

  return setNx(
    dKey(domain),
    JSON.stringify({
      owner,
      tx,
      at: Date.now(),
    }),
    null // a sold name never expires
  );
}

// Founder/family only. Same permanent claim as claimDomain, but sealed and reserved family
// names are allowed through. Callers MUST verify the founder wallet signature first.
// The founder identity itself (ayman) stays not-for-sale here too.
export async function adminClaimDomain(
  domain: string,
  owner: string,
  tx: string
): Promise<boolean> {
  const base = baseName(domain);
  if (!base || isNotForSaleDomain(domain)) return false;

  return setNx(
    dKey(domain),
    JSON.stringify({
      owner,
      tx,
      at: Date.now(),
      admin: true,
    }),
    null // a sold name never expires
  );
}

// One-time nonce for founder claim signatures. Short TTL: a signature must be used promptly.
export async function useNonce(nonce: string, ttlSec = 600): Promise<boolean> {
  return setNx(`teos:nonce:${nonce}`, "1", ttlSec);
}

// Release only the exact claim created by this owner and transaction.
// Redis comparison and deletion happen atomically.
export async function releaseDomain(
  domain: string,
  owner: string,
  tx: string
): Promise<boolean> {
  const key = dKey(domain);

  if (redis) {
    const result = await withTimeout(
      redis.eval<string[], number>(
        `
        local raw = redis.call("GET", KEYS[1])
        if not raw then
          return 0
        end

        local ok, claim = pcall(cjson.decode, raw)
        if not ok then
          return 0
        end

        if claim.owner == ARGV[1] and claim.tx == ARGV[2] then
          return redis.call("DEL", KEYS[1])
        end

        return 0
        `,
        [key],
        [owner, tx]
      )
    );

    return Number(result) === 1;
  }

  const raw = mem.get(key);
  if (!raw) return false;

  try {
    const claim = JSON.parse(raw);

    if (claim.owner !== owner || claim.tx !== tx) {
      return false;
    }

    return mem.delete(key);
  } catch {
    return false;
  }
}

export const claimTx = (signature: string, domain: string) =>
  setNx(tKey(signature), domain.toLowerCase(), 86400);

// Release a payment transaction only if it still belongs to this domain.
export async function releaseTx(
  signature: string,
  domain: string
): Promise<boolean> {
  const key = tKey(signature);
  const expected = domain.toLowerCase();

  if (redis) {
    const result = await withTimeout(
      redis.eval<string[], number>(
        `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("DEL", KEYS[1])
        end

        return 0
        `,
        [key],
        [expected]
      )
    );

    return Number(result) === 1;
  }

  if (mem.get(key) !== expected) return false;

  return mem.delete(key);
}


export async function getClaim(
  domain: string
): Promise<{ owner: string; tx: string; at: number } | null> {
  const raw = redis
    ? await withTimeout(redis.get<unknown>(dKey(domain)))
    : mem.get(dKey(domain));

  if (!raw) return null;

  try { return typeof raw === "string" ? JSON.parse(raw) : (raw as any); } catch { return null; }
}

export async function recordMint(
  domain: string,
  data: { asset: string; signature: string }
): Promise<void> {
  const value = JSON.stringify({
    ...data,
    at: Date.now(),
  });

  if (redis) {
    await withTimeout(redis.set(mKey(domain), value));
  } else {
    mem.set(mKey(domain), value);
  }
}

// Number of names sold through the site.
const soldKey = (tld: string) =>
  tld === "teos" ? "teos:sold" : `teos:sold:${tld}`;

export async function getSoldCount(tld = "teos"): Promise<number> {
  const key = soldKey(tld);

  if (redis) {
    return (
      Number((await withTimeout(redis.get<number | string>(key))) ?? 0) || 0
    );
  }

  return Number(mem.get(key) ?? 0) || 0;
}

export async function incrSold(tld = "teos"): Promise<void> {
  const key = soldKey(tld);

  if (redis) {
    await withTimeout(redis.incr(key));
  } else {
    mem.set(key, String((Number(mem.get(key) ?? 0) || 0) + 1));
  }
}

export const PENDING_KEY = "teos:pending-mints";
// Paid but not minted entries are never dropped. Past this length we only log loudly (and the worker alerts).
export const PENDING_SOFT_CAP = 50_000;

// Paid but not minted: lib/pendingMints.ts retries these every 5 minutes.
export async function logPendingMint(
  domain: string,
  tld: string,
  owner: string,
  tx: string
): Promise<void> {
  const value = JSON.stringify({
    domain,
    tld,
    owner,
    tx,
    at: Date.now(),
    attempts: 0,
  });

  if (redis) {
    const len = await withTimeout(redis.lpush(PENDING_KEY, value));
    if (Number(len) > PENDING_SOFT_CAP) {
      console.error("[pending-mint] ALERT over_soft_cap_kept_anyway", JSON.stringify({ len: Number(len), cap: PENDING_SOFT_CAP }));
    }
    console.error("[pending-mint] queued", JSON.stringify({ domain, tld, owner, tx, backlog: Number(len) }));
  } else {
    console.error("[pending-mint]", value);
  }
}

// Number of paid-but-unminted entries waiting for the retry worker. null when Redis is not configured or unreachable.
export async function pendingBacklog(): Promise<number | null> {
  if (!redis) return null;
  try {
    return Number(await withTimeout(redis.llen(PENDING_KEY)));
  } catch {
    return null;
  }
}

export const isMintRecorded = async (domain: string, tld: string) => has(mKey(fullName(domain, tld)));


// The asset recorded for a name when this site minted it (null for names minted elsewhere, e.g. before the registry).
export async function getMintAsset(domain: string): Promise<string | null> {
  const raw = redis ? await withTimeout(redis.get<unknown>(mKey(domain))) : mem.get(mKey(domain));
  if (!raw) return null;
  try {
    const v: any = typeof raw === "string" ? JSON.parse(raw) : raw;
    return typeof v?.asset === "string" ? v.asset : null;
  } catch { return null; }
}
