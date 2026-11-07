import { getClientIp } from "./client-ip";
import { redis } from "./redis";

const MAX_FAILS = 5;
const LOCK_SEC = 15 * 60;

const attempts = new Map<string, { fails: number; lockedUntil: number }>();
const failKey = (ip: string) => `teos:founder:fails:${ip}`;
const lockKey = (ip: string) => `teos:founder:lock:${ip}`;

export async function isFounderLocked(): Promise<{ locked: boolean; retryAfter: number }> {
  const ip = await getClientIp();
  if (redis) {
    try {
      const ttl = Number(await redis.ttl(lockKey(ip)));
      if (ttl > 0) return { locked: true, retryAfter: ttl };
      return { locked: false, retryAfter: 0 };
    } catch { /* fall through to memory */ }
  }
  const rec = attempts.get(ip);
  if (rec && Date.now() < rec.lockedUntil) return { locked: true, retryAfter: Math.ceil((rec.lockedUntil - Date.now()) / 1000) };
  return { locked: false, retryAfter: 0 };
}

export async function recordFounderFail() {
  const ip = await getClientIp();
  if (redis) {
    try {
      const res = await redis.pipeline().incr(failKey(ip)).expire(failKey(ip), LOCK_SEC, "NX").exec<[number, number]>();
      if (Number(res[0]) >= MAX_FAILS) {
        await redis.set(lockKey(ip), "1", { ex: LOCK_SEC });
        await redis.del(failKey(ip));
      }
      return;
    } catch { /* fall through to memory */ }
  }
  const rec = attempts.get(ip) || { fails: 0, lockedUntil: 0 };
  rec.fails += 1;
  if (rec.fails >= MAX_FAILS) { rec.lockedUntil = Date.now() + LOCK_SEC * 1000; rec.fails = 0; }
  attempts.set(ip, rec);
}

export async function clearFounderFails() {
  const ip = await getClientIp();
  attempts.delete(ip);
  if (redis) { try { await redis.del(failKey(ip)); } catch { /* ignore */ } }
}