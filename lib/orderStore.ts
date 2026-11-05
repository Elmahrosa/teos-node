import { Redis } from "@upstash/redis";
import { env } from "./env";

export type OrderStatus = "PENDING" | "PAID" | "CLAIMED" | "MINTED";

export type Order = {
  id: string;
  quoteId: string;
  domain: string;
  tlds: string[];
  wallet: string;
  signature: string;
  priceLamports: number;
  priceUsd?: number;
  quoteExpiresAt: number;
  status: OrderStatus;
  paymentTx?: string;
  createdAt: number;
  updatedAt: number;
};

const redis =
  env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")
    ? new Redis({
        url: env("UPSTASH_REDIS_REST_URL")!,
        token: env("UPSTASH_REDIS_REST_TOKEN")!,
      })
    : null;

export const orderStorePersistent = redis !== null;

const QUOTE_GRACE_MS = 600_000;
const quoteKey = (id: string) => `teos:quote:${id}`;
const reservationKey = (id: string) => `teos:reservation:${id}`;
const orderKey = (id: string) => `teos:order:${id}`;

const RESERVE_SCRIPT = `
local raw = redis.call("GET", KEYS[1])
if not raw then
  return cjson.encode({ ok = false, reason = "quote_missing" })
end

local decoded, quote = pcall(cjson.decode, raw)
if not decoded or type(quote) ~= "table" then
  return cjson.encode({ ok = false, reason = "quote_corrupt" })
end

if quote.id ~= ARGV[2] then
  return cjson.encode({ ok = false, reason = "quote_mismatch" })
end

if quote.used == true then
  return cjson.encode({ ok = false, reason = "quote_used" })
end

if quote.domain ~= ARGV[4] then
  return cjson.encode({ ok = false, reason = "domain_mismatch" })
end

local expiresAt = tonumber(quote.expiresAt)
if not expiresAt or tonumber(ARGV[6]) > expiresAt + tonumber(ARGV[7]) then
  return cjson.encode({ ok = false, reason = "quote_expired" })
end

local existingRaw = redis.call("GET", KEYS[2])
if existingRaw then
  local valid, existing = pcall(cjson.decode, existingRaw)
  if not valid or type(existing) ~= "table" then
    return cjson.encode({ ok = false, reason = "reservation_corrupt" })
  end

  if existing.wallet == ARGV[3]
    and existing.signature == ARGV[5]
    and existing.domain == ARGV[4]
    and existing.quoteId == ARGV[2] then

    local previousOrder = redis.call("GET", ARGV[8] .. existing.requestId)
    if not previousOrder then
      return cjson.encode({ ok = false, reason = "order_missing" })
    end

    local orderOk, previous = pcall(cjson.decode, previousOrder)
    if not orderOk or type(previous) ~= "table" then
      return cjson.encode({ ok = false, reason = "order_corrupt" })
    end

    return cjson.encode({ ok = true, reused = true, order = previous })
  end

  return cjson.encode({ ok = false, reason = "already_reserved" })
end

if redis.call("EXISTS", KEYS[3]) == 1 then
  return cjson.encode({ ok = false, reason = "request_id_collision" })
end

local price = tonumber(quote.priceLamports)
if not price or price <= 0 then
  return cjson.encode({ ok = false, reason = "quote_price_invalid" })
end

local tlds = quote.tlds or { "teos" }
local now = tonumber(ARGV[6])

local order = {
  id = ARGV[1],
  quoteId = ARGV[2],
  domain = ARGV[4],
  tlds = tlds,
  wallet = ARGV[3],
  signature = ARGV[5],
  priceLamports = price,
  quoteExpiresAt = expiresAt,
  status = "PENDING",
  createdAt = now,
  updatedAt = now
}

if quote.priceUsd ~= nil then
  order.priceUsd = quote.priceUsd
end

local reservation = {
  requestId = ARGV[1],
  quoteId = ARGV[2],
  domain = ARGV[4],
  wallet = ARGV[3],
  signature = ARGV[5],
  createdAt = now
}

redis.call("SET", KEYS[2], cjson.encode(reservation))
redis.call("SET", KEYS[3], cjson.encode(order))

return cjson.encode({ ok = true, reused = false, order = order })
`;

export async function reserveOrder(input: {
  quoteId: string;
  domain: string;
  wallet: string;
  signature: string;
}): Promise<
  | { ok: true; reused: boolean; order: Order }
  | { ok: false; reason: string }
> {
  if (!redis) throw new Error("order_store_unavailable");

  const requestId = crypto.randomUUID();
  const now = Date.now();

  const result = await redis.eval<string[], string>(
    RESERVE_SCRIPT,
    [
      quoteKey(input.quoteId),
      reservationKey(input.quoteId),
      orderKey(requestId),
    ],
    [
      requestId,
      input.quoteId,
      input.wallet,
      input.domain,
      input.signature,
      String(now),
      String(QUOTE_GRACE_MS),
      "teos:order:",
    ],
  );

  if (typeof result !== "string") {
    throw new Error("order_store_invalid_response");
  }

  const parsed = JSON.parse(result) as {
    ok: boolean;
    reason?: string;
    reused?: boolean;
    order?: Order;
  };

  if (!parsed.ok) {
    return { ok: false, reason: parsed.reason || "reservation_failed" };
  }

  if (!parsed.order || !parsed.order.id) {
    throw new Error("order_store_missing_order");
  }

  return {
    ok: true,
    reused: parsed.reused === true,
    order: parsed.order,
  };
}

export async function getOrder(requestId: string): Promise<Order | null> {
  if (!redis) throw new Error("order_store_unavailable");

  const raw = await redis.get<string | Order>(orderKey(requestId));
  if (!raw) return null;

  const order = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!order || order.id !== requestId) {
    throw new Error("order_store_corrupt");
  }

  return order;
}
