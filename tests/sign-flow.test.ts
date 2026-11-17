import test from "node:test";
import assert from "node:assert/strict";

const { isProofFresh, signatureToBase64, TimeoutError, withTimeout } = await import("../lib/sign-flow");
const { clearProof, readProof, saveProof } = await import("../lib/sign-flow");

test("withTimeout: passes a resolved value through and keeps its type", async () => {
  const value = await withTimeout(Promise.resolve("0xabc"), 1_000, "sign");
  assert.equal(value, "0xabc");
});

test("withTimeout: forwards the wallet's rejection untouched", async () => {
  const walletError = new Error("user rejected the request");
  await assert.rejects(withTimeout(Promise.reject(walletError), 1_000, "sign"), (err) => err === walletError);
});

test("withTimeout: rejects with TimeoutError when the wallet never answers", async () => {
  const never = new Promise<never>(() => {});
  await assert.rejects(withTimeout(never, 10, "sign"), (err) => {
    assert.ok(err instanceof TimeoutError);
    assert.equal(err.phase, "sign");
    assert.equal(err.name, "TimeoutError");
    return true;
  });
});

test("withTimeout: a late answer cannot resurrect a timed-out request", async () => {
  let resolveLate: (value: string) => void = () => {};
  const late = new Promise<string>((resolve) => { resolveLate = resolve; });
  await assert.rejects(withTimeout(late, 10, "verify"), TimeoutError);
  resolveLate("too late");
  // The rejected promise stays rejected; the caller must cache the late value itself.
  assert.equal(await late, "too late");
});

test("isProofFresh: accepts the whole server window and rejects stale or future stamps", () => {
  const now = 1_000_000;
  const ttl = 285_000;
  assert.equal(isProofFresh(now, now, ttl), true);
  assert.equal(isProofFresh(now - ttl, now, ttl), true);
  assert.equal(isProofFresh(now - ttl - 1, now, ttl), false);
  // A wallet clock slightly ahead of the server clock is tolerated, a wild future stamp is not.
  assert.equal(isProofFresh(now + 30_000, now, ttl), true);
  assert.equal(isProofFresh(now + 61_000, now, ttl), false);
  assert.equal(isProofFresh(Number.NaN, now, ttl), false);
});

test("signatureToBase64: Uint8Array, {signature} wrapper, empty and junk", () => {
  assert.equal(signatureToBase64(new Uint8Array([0, 1, 2, 255])), "AAEC/w==");
  assert.equal(signatureToBase64({ signature: new Uint8Array([0, 1, 2, 255]) }), "AAEC/w==");
  assert.equal(signatureToBase64(new Uint8Array()), null);
  assert.equal(signatureToBase64({ signature: new Uint8Array() }), null);
  assert.equal(signatureToBase64(undefined), null);
  assert.equal(signatureToBase64(null), null);
  assert.equal(signatureToBase64("AAEC/w=="), null);
});

test("proof storage: round-trips, expires, and forgets the wallet mismatch", () => {
  const mem = new Map<string, string>();
  const fakeStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, v); },
    removeItem: (k: string) => { mem.delete(k); },
  };
  const g = globalThis as unknown as { window?: { sessionStorage: typeof fakeStorage } };
  g.window = { sessionStorage: fakeStorage };
  try {
    const now = 5_000_000;
    const proof = { name: "ayman", ts: now, signature: "AAEC/w==", publicKey: "5qMYGVpKrKfS7myEYxt7t5QLs48BYeZq9B4nF3q6gjcT" };
    saveProof(proof);
    assert.deepEqual(readProof("ayman", 285_000, now + 1_000), proof);
    // Expired: dropped from storage instead of being retried forever.
    assert.equal(readProof("ayman", 285_000, now + 286_000), null);
    assert.equal(mem.size, 0);

    saveProof(proof);
    clearProof("ayman");
    assert.equal(readProof("ayman", 285_000, now), null);
  } finally {
    delete g.window;
  }
});

test("proof storage: absent storage and corrupt JSON read as no proof", () => {
  assert.equal(readProof("ayman", 285_000), null);
  const mem = new Map<string, string>([["teos:sig:ayman", "{not json"]]);
  const g = globalThis as unknown as { window?: { sessionStorage: unknown } };
  g.window = {
    sessionStorage: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: () => {},
      removeItem: (k: string) => { mem.delete(k); },
    },
  };
  try {
    assert.equal(readProof("ayman", 285_000), null);
  } finally {
    delete g.window;
  }
});
