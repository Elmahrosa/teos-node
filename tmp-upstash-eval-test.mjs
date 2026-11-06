import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

try {
  const script = redis.createScript('return "TEOS_EVAL_OK"');
  const result = await script.eval([], []);
  console.log(result === "TEOS_EVAL_OK" ? "EVAL_SUPPORTED" : "UNEXPECTED_RESULT");
} catch (error) {
  console.error("EVAL_FAILED:", String(error?.message ?? error).slice(0, 180));
  process.exitCode = 1;
}
