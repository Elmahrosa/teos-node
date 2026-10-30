import { Redis } from "@upstash/redis";
import { parseDomain, isReservedWord } from "./domain-rules";
import { isSealedDomain } from "./sealed";
import { env } from "./env";
import { isClaimed } from "./registry";
import { priceFor } from "./pricing";

export type Quote = {
  id: string;
  domain: string; // lowercase, validated
  priceLamports: number;
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

export async function createQuote(rawDomain: unknown): Promise<CreateResult> {
  const parsed = parseDomain(rawDomain);
  if (!parsed.ok) return { ok: false, status: parsed.status, body: parsed.body };
  const domain = parsed.domain;
  if (isReservedWord(domain) || isSealedDomain(domain)) {
    return { ok: false, status: 200, body: { available: false, reason: "reserved", domain } };
  }
  if (await isClaimed(domain)) {
    return { ok: false, status: 200, body: { available: false, reason: "taken", domain } };
  }
  let price;
  try { price = await priceFor(domain); } catch { return { ok: false, status: 503, body: { error: "price_unavailable" } }; }
  const id = crypto.randomUUID();
  const expiresAt = Date.now() + TTL_SECONDS * 1000;
  const quote: Quote = {
    id,
    domain,
    priceLamports: Math.round(price.priceSOL * 1e9),
    message: `teos://register/${domain}.teos/${id}/${expiresAt}`,
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
