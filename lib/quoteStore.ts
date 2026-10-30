import { Redis } from "@upstash/redis";
import { parseDomain } from "./domain-rules";
import { env } from "./env";
import { getSolUsd, usdToLamports } from "./pricing";
import { checkTlds } from "./check";
import { parseTlds } from "./tlds";

export type Quote = {
  id: string;
  domain: string; // lowercase, validated
  priceLamports: number;
  priceUsd?: number;
  isPromo?: boolean;
  tlds?: string[]; // absent on quotes made before multi-TLD: means ["teos"]
  message: string; // exact bytes the wallet must sign
  expiresAt: number; // epoch ms
  used: boolean;
};

export const PRICE_LAMPORTS = Number(process.env.TEOS_PRICE_LAMPORTS) || 50_000_000;
const TTL_SECONDS = Number(process.env.QUOTE_TTL_SECONDS) || 300;

const redis =
  env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")
    ? new Redis({ url: env("UPSTASH_REDIS_REST_URL")!, token: env("UPSTASH_REDIS_REST_TOKEN")! })
    : null;

// In-memory fallback: per instance, lost on restart.
const mem = new Map<string, Quote>();
function sweep() {
  const now = Date.now();
  mem.forEach((q, k) => { if (q.expiresAt < now) mem.delete(k); });
}
if (!redis) setInterval(sweep, 60_000).unref?.();

const key = (id: string) => `teos:quote:${id}`;

async function put(q: Quote) {
  const ttl = Math.max(1, Math.ceil((q.expiresAt - Date.now()) / 1000));
  if (redis) await redis.set(key(q.id), JSON.stringify(q), { ex: ttl });
  else mem.set(q.id, q);
}

export type CreateResult =
  | { ok: true; quote: Quote }
  | { ok: false; status: number; body: Record<string, unknown> };

export async function createQuote(rawDomain: unknown, rawTlds?: unknown): Promise<CreateResult> {
  const parsed = parseDomain(rawDomain);
  if (!parsed.ok) return { ok: false, status: parsed.status, body: parsed.body };
  const domain = parsed.domain;
  const tlds = rawTlds === undefined ? ["teos"] : parseTlds(rawTlds);
  if (!tlds) return { ok: false, status: 400, body: { error: "invalid_tlds" } };
  const checks = await checkTlds(domain, tlds);
  const bad = checks.find((c) => !c.available);
  if (bad) return { ok: false, status: 200, body: { available: false, reason: bad.reason, domain, tld: bad.tld } };
  const solUsd = await getSolUsd();
  if (!solUsd) return { ok: false, status: 503, body: { error: "price_unavailable" } };
  const totalUsd = checks.reduce((n, c) => n + c.price_usd, 0);
  const priceLamports = usdToLamports(totalUsd, solUsd);
  const id = crypto.randomUUID();
  const expiresAt = Date.now() + TTL_SECONDS * 1000;
  // Single .teos keeps the original message format.
  const suffix = tlds.length === 1 ? tlds[0] : tlds.join("+");
  const quote: Quote = {
    id,
    domain,
    priceLamports,
    priceUsd: totalUsd,
    isPromo: checks.every((c) => c.is_promo),
    tlds,
    message: `teos://register/${domain}.${suffix}/${id}/${expiresAt}`,
    expiresAt,
    used: false,
  };
  await put(quote);
  return { ok: true, quote };
}

export async function getQuote(id: string): Promise<Quote | null> {
  let q: Quote | null = null;
  if (redis) {
    const raw = await redis.get<string | Quote>(key(id));
    q = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : null;
  } else {
    q = mem.get(id) ?? null;
  }
  if (!q || q.expiresAt < Date.now()) return null;
  return q;
}

export async function markUsed(id: string) {
  const q = await getQuote(id);
  if (q) await put({ ...q, used: true });
}
