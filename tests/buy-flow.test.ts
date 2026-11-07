import test, { mock } from "node:test";
import assert from "node:assert/strict";
import bs58 from "bs58";
import * as ed from "@noble/ed25519";
import { randomBytes } from "node:crypto";

const rand32 = () => new Uint8Array(randomBytes(32));

// Rehearsal of quote -> pay -> register with every network call faked. No real wallet, RPC or mint is touched.
mock.module("next/headers", { namedExports: { headers: async () => new Headers({ "x-forwarded-for": "9.9.9.9" }) } });

const AUTH = "TestAuthority1111111111111111111111111111111";
const TREASURY = bs58.encode(rand32()); // any 32-byte address
const mintSeed = rand32();
const mintKey = Uint8Array.from([...mintSeed, ...(await ed.getPublicKeyAsync(mintSeed))]);
Object.assign(process.env, {
  REGISTRATION_OPEN: "true", TREASURY_WALLET: TREASURY, HELIUS_API_KEY: "test", TEOS_UPDATE_AUTHORITY: AUTH,
  MINT_AUTHORITY_KEYPAIR: JSON.stringify(Array.from(mintKey)),
});
delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN; delete process.env.COLLECTION_ADDRESS;

async function wallet() {
  const priv = rand32();
  return { priv, pub: bs58.encode(await ed.getPublicKeyAsync(priv)) };
}
const owners: Record<string, string[]> = {}; // wallet -> asset names it holds
const txs: Record<string, any> = {};         // signature -> fake getTransaction result

const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: any, init?: any) => {
  const u = String(url);
  const json = (b: unknown) => new Response(JSON.stringify(b), { headers: { "content-type": "application/json" } });
  if (/coinbase|coingecko|binance/.test(u)) return json({ data: { amount: "100" }, solana: { usd: 100 }, price: "100" });
  if (u.includes("helius")) {
    const b = JSON.parse(init.body);
    if (b.method === "getAssetsByOwner") {
      const items = (owners[b.params.ownerAddress] ?? []).map((n) => ({ id: `asset-${n}`, content: { metadata: { name: n } }, authorities: [{ address: AUTH }] }));
      return json({ jsonrpc: "2.0", id: b.id, result: { items } });
    }
    if (b.method === "getTransaction") return json({ jsonrpc: "2.0", id: b.id, result: txs[b.params[0]] ?? null });
    if (b.method === "getBalance") return json({ jsonrpc: "2.0", id: b.id, result: { context: { slot: 1 }, value: 9_000_000_000 } });
    return json({ jsonrpc: "2.0", id: b.id, error: { code: -32000, message: "faked: no mint" } });
  }
  return realFetch(url, init);
}) as typeof fetch;

const post = (path: string, body: unknown) =>
  new Request(`http://t${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

async function quoteFor(domain: string, tld: string) {
  const { POST } = await import("../app/api/quote/route");
  const r = await POST(post("/api/quote", { domain, tlds: tld }));
  assert.equal(r.status, 200);
  return r.json() as Promise<any>;
}

let n = 0;
function pay(payer: string, lamports: number) {
  const sig = `sig-${++n}-${Date.now()}`;
  txs[sig] = {
    blockTime: Math.floor(Date.now() / 1000), slot: 1,
    transaction: { signatures: [sig], message: { accountKeys: [{ pubkey: payer, signer: true }], instructions: [{ program: "system", parsed: { type: "transfer", info: { source: payer, destination: TREASURY, lamports } } }] } },
    meta: { err: null, innerInstructions: [] },
  };
  return sig;
}

async function register(w: { priv: Uint8Array; pub: string }, domain: string, q: any, payment_tx: string) {
  const { POST } = await import("../app/api/register/route");
  const sig = await ed.signAsync(new TextEncoder().encode(q.message_to_sign), w.priv);
  const r = await POST(post("/api/register", { domain, quote_id: q.quote_id, signature: Buffer.from(sig).toString("base64"), publicKey: w.pub, payment_tx }));
  return { status: r.status, body: (await r.json()) as any };
}

test("quote hands the client the treasury and the price; client never sets either", async () => {
  const q = await quoteFor("ahmedtest", "eg");
  assert.equal(q.pay_to, TREASURY);
  assert.equal(q.price_usd, 60); // 5+ char name, "arab" tier, from core/pricing.json
  const { POST } = await import("../app/api/quote/route");
  const r = await POST(post("/api/quote", { domain: "ahmedtest", tlds: "eg", price_usd: 1, price_lamports: 1, pay_to: "attacker" }));
  const j: any = await r.json();
  assert.equal(j.price_usd, 60);
  assert.equal(j.pay_to, TREASURY);
});

test("non-owner is rejected even with a valid payment", async () => {
  const w = await wallet();
  const q = await quoteFor("nonowner", "eg");
  const tx = pay(w.pub, q.price_lamports);
  const r = await register(w, "nonowner", q, tx);
  assert.equal(r.status, 403);
  assert.equal(r.body.error, "teos_required");
});

test("owner pays and registers; payment signature and quote cannot be reused", async () => {
  const w = await wallet();
  owners[w.pub] = ["ahmedtest.teos", "ahmedtwo.teos"];
  const q = await quoteFor("ahmedtest", "eg");
  const tx = pay(w.pub, q.price_lamports);
  const ok = await register(w, "ahmedtest", q, tx);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.success, true);
  assert.equal(ok.body.domain, "ahmedtest.eg");
  assert.equal(ok.body.pending_mint, true); // the mint transaction itself is faked to fail: payment and claim are what is under test
  const { isClaimed } = await import("../lib/registry");
  assert.equal(await isClaimed("ahmedtest.eg"), true);

  // same quote again
  const again = await register(w, "ahmedtest", q, tx);
  assert.equal(again.status, 401);
  assert.equal(again.body.reason, "already_used");

  // same payment signature on a different name
  const q2 = await quoteFor("ahmedtwo", "eg");
  const reuse = await register(w, "ahmedtwo", q2, tx);
  assert.ok([402, 409].includes(reuse.status), `reuse status ${reuse.status}`);
  assert.equal(await isClaimed("ahmedtwo.eg"), false);

  // underpayment
  const q3 = await quoteFor("ahmedtwo", "eg");
  const low = await register(w, "ahmedtwo", q3, pay(w.pub, Math.floor(q3.price_lamports / 2)));
  assert.equal(low.status, 402);
  assert.equal(await isClaimed("ahmedtwo.eg"), false);
});

test("founder names never get a quote or a registration", async () => {
  const { POST } = await import("../app/api/quote/route");
  const j: any = await (await POST(post("/api/quote", { domain: "ayman", tlds: "eg" }))).json();
  assert.equal(j.available, false);
  assert.ok(!j.quote_id);
});
