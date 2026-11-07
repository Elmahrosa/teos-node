import { redis } from "./redis";
import { env } from "./env";
import { PENDING_KEY, isMintRecorded, recordMint } from "./registry";
import { mintTeosAsset, mintFunds } from "./mint";
import { fullName } from "./tlds";

// Retry worker for paid-but-unminted names (teos:pending-mints). Runs every 5 minutes from instrumentation.ts.
// Safety rules: never drop an entry, never mint twice, never mint blind when the duplicate check is unavailable.

export const RETRY_INTERVAL_MS = 5 * 60_000;
export const ALERT_BACKLOG = 10;
const BATCH = 20;
const LOCK_KEY = "teos:pending-mints:lock";
const PROCESSING_KEY = "teos:pending-mints:processing";
const ALERT_KEY = "teos:pending-mints:alerted";

type Entry = { domain: string; tld: string; owner: string; tx: string; at: number; attempts?: number; lastError?: string };

// Did the mint actually land on chain although our call failed (timeout, confirm error)? null = cannot tell.
async function mintedOnChain(owner: string, domain: string, tld: string): Promise<{ asset: string; signature: string } | null | "unknown"> {
  const key = env("HELIUS_API_KEY");
  const url = env("MINT_RPC_URL") || env("HELIUS_RPC_URL") || (key ? `https://mainnet.helius-rpc.com/?api-key=${key}` : null);
  if (!url) return "unknown";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "pending-dup-check", method: "getAssetsByOwner", params: { ownerAddress: owner, page: 1, limit: 1000 } }),
      signal: AbortSignal.timeout(10_000),
    });
    const json: any = await res.json();
    if (!Array.isArray(json?.result?.items)) return "unknown";
    const want = `${domain}.${tld}`.toLowerCase();
    const hit = json.result.items.find((a: any) => String(a?.content?.metadata?.name ?? "").toLowerCase() === want);
    return hit ? { asset: String(hit.id), signature: "found_on_chain" } : null;
  } catch {
    return "unknown";
  }
}

async function sendAlert(text: string) {
  console.error("[pending-mint] ALERT", text);
  const hook = env("ALERT_WEBHOOK_URL");
  if (!hook || !redis) return;
  try {
    // At most one webhook per 30 minutes.
    if ((await redis.set(ALERT_KEY, "1", { nx: true, ex: 1800 })) !== "OK") return;
    await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, content: text }), signal: AbortSignal.timeout(5000) });
  } catch { /* the log line above is the fallback */ }
}

export async function retryPendingMints(): Promise<{ processed: number; minted: number; backlog: number } | null> {
  if (!redis) return null;
  // One worker at a time across instances.
  if ((await redis.set(LOCK_KEY, String(Date.now()), { nx: true, ex: 240 })) !== "OK") return null;
  let processed = 0, minted = 0;
  try {
    // Anything left in processing by a crashed run goes back to the queue first.
    while ((await redis.lmove(PROCESSING_KEY, PENDING_KEY, "right", "left")) !== null) { /* requeue */ }

    const start = Number(await redis.llen(PENDING_KEY));
    if (start > ALERT_BACKLOG) await sendAlert(`pending mints backlog is ${start} (threshold ${ALERT_BACKLOG})`);

    for (let i = 0; i < Math.min(start, BATCH); i++) {
      // Oldest entry first; it stays in the processing list until it is done or re-queued.
      const raw = await redis.lmove(PENDING_KEY, PROCESSING_KEY, "right", "left");
      if (raw === null) break;
      const rawStr = typeof raw === "string" ? raw : JSON.stringify(raw);
      processed++;
      let e: Entry;
      try { e = typeof raw === "string" ? JSON.parse(raw) : (raw as Entry); } catch {
        console.error("[pending-mint] unparseable_entry_kept", rawStr.slice(0, 300));
        await redis.lpush(PENDING_KEY, rawStr); await redis.lrem(PROCESSING_KEY, 1, rawStr);
        continue;
      }
      const requeue = async (err: string) => {
        const next = JSON.stringify({ ...e, attempts: (e.attempts ?? 0) + 1, lastError: err.slice(0, 200), lastTry: Date.now() });
        await redis!.lpush(PENDING_KEY, next);
        await redis!.lrem(PROCESSING_KEY, 1, rawStr);
        console.error("[pending-mint] retry_failed", JSON.stringify({ domain: e.domain, tld: e.tld, owner: e.owner, tx: e.tx, attempts: (e.attempts ?? 0) + 1, error: err.slice(0, 200) }));
      };
      try {
        if (await isMintRecorded(e.domain, e.tld)) { await redis.lrem(PROCESSING_KEY, 1, rawStr); continue; } // already done
        const dup = await mintedOnChain(e.owner, e.domain, e.tld);
        if (dup === "unknown") { await requeue("duplicate_check_unavailable"); continue; }
        if (dup) {
          await recordMint(fullName(e.domain, e.tld), dup);
          await redis.lrem(PROCESSING_KEY, 1, rawStr);
          console.error("[pending-mint] already_on_chain_recorded", JSON.stringify({ domain: e.domain, tld: e.tld, owner: e.owner, asset: dup.asset }));
          continue;
        }
        if (!(await mintFunds(1)).ok) { await requeue("mint_wallet_underfunded"); continue; }
        const mint = await mintTeosAsset(e.domain, e.owner, e.tld);
        if (!mint) { await requeue("mint_not_configured"); continue; }
        await recordMint(fullName(e.domain, e.tld), mint);
        await redis.lrem(PROCESSING_KEY, 1, rawStr);
        minted++;
        console.log("[pending-mint] minted", JSON.stringify({ domain: e.domain, tld: e.tld, owner: e.owner, asset: mint.asset }));
      } catch (err: any) {
        await requeue(String(err?.message ?? err));
      }
    }
    return { processed, minted, backlog: Number(await redis.llen(PENDING_KEY)) };
  } finally {
    await redis.del(LOCK_KEY).catch(() => {});
  }
}

let started = false;
export function startPendingMintWorker() {
  if (started) return;
  started = true;
  const tick = () => retryPendingMints().then((r) => { if (r && (r.processed || r.backlog)) console.log("[pending-mint] tick", JSON.stringify(r)); }).catch((e) => console.error("[pending-mint] worker_error", String(e?.message ?? e).slice(0, 200)));
  setTimeout(tick, 30_000).unref?.();
  setInterval(tick, RETRY_INTERVAL_MS).unref?.();
}
