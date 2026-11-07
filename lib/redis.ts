import { Redis } from "@upstash/redis";
import { env } from "./env";

// Shared Upstash client for rate limiting and lockout. null when Upstash is not configured.
export const redis: Redis | null =
  env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")
    ? new Redis({ url: env("UPSTASH_REDIS_REST_URL")!, token: env("UPSTASH_REDIS_REST_TOKEN")! })
    : null;