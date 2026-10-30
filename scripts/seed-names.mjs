// One-off: record manually minted names in the Upstash registry. Needs UPSTASH_REDIS_REST_URL/TOKEN.
// elkasassia is early-bird #1. Founders ayman/elmahrosa are reserved in code, not stored here.
import { Redis } from "@upstash/redis";
const r = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
for (const [name, owner] of [["elkasassia", process.env.ELKASASSIA_OWNER]]) {
  if (!owner) throw new Error("set ELKASASSIA_OWNER to the full wallet address");
  console.log(name, await r.set(`teos:domain:${name}`, JSON.stringify({ owner, tx: "manual", at: Date.now() }), { nx: true }));
}
