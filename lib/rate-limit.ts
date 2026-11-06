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

const store = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(endpoint: string, limit: number, windowSec: number) {
  const ip = await getClientIp();
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: true, resetInSec: windowSec };
  }
  if (entry.count >= limit) {
    return { allowed: false, resetInSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, resetInSec: Math.ceil((entry.resetAt - now) / 1000) };
}

export function rateLimitResponse(resetInSec: number) {
  return new Response(JSON.stringify({ error: "rate_limited", retry_after: resetInSec }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(resetInSec) },
  });
}
