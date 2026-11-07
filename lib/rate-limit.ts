import { getClientIp } from "./client-ip";
import { redis } from "./redis";

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// Pure in-memory fixed window. Used when Upstash is not configured or briefly unreachable.
export function hitMemory(map: Map<string, Entry>, key: string, limit: number, windowSec: number, now = Date.now()) {
  if (map.size > 5000) for (const [k, v] of map) if (now > v.resetAt) map.delete(k);
  const e = map.get(key);
  if (!e || now > e.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: true, resetInSec: windowSec };
  }
  const resetInSec = Math.max(1, Math.ceil((e.resetAt - now) / 1000));
  if (e.count >= limit) return { allowed: false, resetInSec };
  e.count++;
  return { allowed: true, resetInSec };
}

// Shared across all instances through Upstash (INCR + EXPIRE NX). Falls back to per-instance memory on Redis errors.
export async function checkRateLimitKey(key: string, limit: number, windowSec: number) {
  if (redis) {
    try {
      const k = `teos:rl:${key}`;
      const res = await redis.pipeline().incr(k).expire(k, windowSec, "NX").ttl(k).exec<[number, number, number]>();
      const count = Number(res[0]);
      const ttl = Number(res[2]);
      return { allowed: count <= limit, resetInSec: ttl > 0 ? ttl : windowSec };
    } catch (e) {
      console.error("[rate-limit] redis_error_fallback_to_memory");
    }
  }
  return hitMemory(store, key, limit, windowSec);
}

export async function checkRateLimit(endpoint: string, limit: number, windowSec: number) {
  const ip = await getClientIp();
  return checkRateLimitKey(`${endpoint}:${ip}`, limit, windowSec);
}

export function rateLimitResponse(resetInSec: number) {
  return new Response(JSON.stringify({ error: "rate_limited", retry_after: resetInSec }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(resetInSec) },
  });
}