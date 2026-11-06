import { headers } from "next/headers";

async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2];
    if (parts.length === 1) return parts[0];
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

const attempts = new Map<string, { fails: number; lockedUntil: number }>();

export async function isFounderLocked(): Promise<{ locked: boolean; retryAfter: number }> {
  const ip = await getClientIp();
  const rec = attempts.get(ip);
  if (!rec) return { locked: false, retryAfter: 0 };
  if (Date.now() < rec.lockedUntil) {
    return { locked: true, retryAfter: Math.ceil((rec.lockedUntil - Date.now()) / 1000) };
  }
  return { locked: false, retryAfter: 0 };
}

export async function recordFounderFail() {
  const ip = await getClientIp();
  const rec = attempts.get(ip) || { fails: 0, lockedUntil: 0 };
  rec.fails += 1;
  if (rec.fails >= 5) {
    rec.lockedUntil = Date.now() + 15 * 60 * 1000;
    rec.fails = 0;
  }
  attempts.set(ip, rec);
}

export async function clearFounderFails() {
  const ip = await getClientIp();
  attempts.delete(ip);
}
