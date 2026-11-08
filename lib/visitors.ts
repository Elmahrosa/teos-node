import { Redis } from "@upstash/redis";
import { env } from "./env";
import { MEMBERS } from "./joined";

// Anonymous country counter. Stores ONLY per-country visit totals: no IP, no cookie, no name, no wallet.

export const UNKNOWN = "ZZ";
const KEY = "visitors:countries";

const redis =
  env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")
    ? new Redis({ url: env("UPSTASH_REDIS_REST_URL")!, token: env("UPSTASH_REDIS_REST_TOKEN")! })
    : null;

// Fallback when Redis is not configured: per instance, resets on restart.
const mem = new Map<string, number>();

function withTimeout<T>(p: Promise<T>, ms = 3000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("visitors_timeout")), ms))]);
}

// Country from edge-set geo headers only. Cloudflare and Vercel set these; Railway's edge is not
// documented to set one, so without a header the visit is counted as unknown (ZZ).
export function countryFromHeaders(h: { get(name: string): string | null }): string {
  for (const name of ["cf-ipcountry", "x-vercel-ip-country", "x-country-code"]) {
    const v = h.get(name)?.trim().toUpperCase();
    if (v && /^[A-Z]{2}$/.test(v) && v !== "XX" && v !== "T1") return v;
  }
  return UNKNOWN;
}

export function flagOf(code: string): string {
  if (!/^[A-Z]{2}$/.test(code) || code === UNKNOWN) return "🌐";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function countryName(code: string, locale = "en"): string {
  if (code === UNKNOWN) return locale === "ar" ? "غير معروف" : "Unknown";
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

export async function recordVisit(code: string): Promise<void> {
  if (redis) {
    await withTimeout(redis.hincrby(KEY, code, 1));
    return;
  }
  mem.set(code, (mem.get(code) ?? 0) + 1);
}

async function readCounts(): Promise<Record<string, number>> {
  if (redis) {
    const raw = (await withTimeout(redis.hgetall<Record<string, number | string>>(KEY))) ?? {};
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Number(v) || 0]));
  }
  return Object.fromEntries(mem);
}

export type CountryRow = { code: string; name: string; flag: string; visits: number; joined: number };
export type VisitorStats = { total: number; nations: number; joined: number; top: CountryRow[] };

// Pure: build the public stats from raw counts and the member list.
export function buildStats(counts: Record<string, number>, members = MEMBERS, topN = 10): VisitorStats {
  const joinedBy: Record<string, number> = {};
  for (const m of members) if (m.joined) joinedBy[m.country] = (joinedBy[m.country] ?? 0) + 1;
  // Only countries that actually have visits are listed (joined-only rows read as "0 visits - 9 joined").
  // Unknown (no geo header) is listed too, so the rows always add up to the total.
  const rows: CountryRow[] = Object.keys(counts)
    .filter((c) => (counts[c] ?? 0) > 0)
    .map((code) => ({ code, name: countryName(code), flag: flagOf(code), visits: counts[code] ?? 0, joined: joinedBy[code] ?? 0 }))
    .sort((a, b) => b.visits - a.visits || b.joined - a.joined || a.code.localeCompare(b.code));
  return {
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    nations: Object.entries(counts).filter(([c, n]) => c !== UNKNOWN && n > 0).length,
    joined: members.filter((m) => m.joined).length,
    top: rows.slice(0, topN),
  };
}

export async function getStats(): Promise<VisitorStats> {
  return buildStats(await readCounts());
}
