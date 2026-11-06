import { Redis } from "@upstash/redis";
import { parseDomain } from "./domain-rules";
import { env } from "./env";
import { getSolUsd, usdToLamports } from "./pricing";
import { checkTlds } from "./check";
import { parseTlds } from "./tlds";
import { mintFunds } from "./mint";

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
// A buyer whose wallet approval ran past the quote TTL has already paid: keep the quote for register() this much longer.
export const GRACE_MS = 600_000;

const redis =
  env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")
    ? new Redis({ url: env("UPSTASH_REDIS_REST_URL")!, token: env("UPSTASH_REDIS_REST_TOKEN")! })
    : null;

// In-memory fallback: per instance, lost on restart.
const mem = new Map<string, Quote>();
function sweep() {
  const now = Date.now();
  mem.forEach((q, k) => { if (q.expiresAt + GRACE_MS < now) mem.delete(k); });
}
if (!redis) setInterval(sweep, 60_000).unref?.();

const key = (id: string) => `teos:quote:${id}`;

async function put(q: Quote) {
  const ttl = Math.max(1, Math.ceil((q.expiresAt - Date.now()) / 1000)) + GRACE_MS / 1000;
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
  if (!(await mintFunds(tlds.length)).ok) return { ok: false, status: 503, body: { error: "mint_unavailable" } };
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
    if (!raw) return null;
    try { q = typeof raw === "string" ? JSON.parse(raw) : (raw as Quote); } catch { return null; }
  } else {
    q = mem.get(id) ?? null;
  }
  if (!q || q.expiresAt + GRACE_MS < Date.now()) return null;
  return q;
}

export async function markUsed(id: string): Promise<boolean> {
  if (redis) {
    const res = await redis.eval(
      `local raw = redis.call("GET", KEYS[1])
       if not raw then return 0 end
       local ok, q = pcall(cjson.decode, raw)
       if not ok then return 0 end
       if q.used then return 0 end
       q.used = true
       redis.call("SET", KEYS[1], cjson.encode(q), "KEEPTTL")
       return 1`,
      [key(id)],
      []
    );
    return Number(res) === 1;
  }
  const q = mem.get(id);
  if (!q || q.used) return false;
  q.used = true;
  return true;
}
