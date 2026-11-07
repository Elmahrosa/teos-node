import test from "node:test";
import assert from "node:assert/strict";

process.env.FOUNDER_SESSION_SECRET = "x".repeat(48);
const auth = await import("../lib/founderAuth");
const edge = await import("../lib/session-edge");

test("scrypt hash round-trips and rejects wrong password", async () => {
  const h = await auth.hashPassword("correct horse battery staple");
  assert.match(h, /^scrypt\$65536\$8\$1\$/);
  assert.equal(await auth.verifyPasswordHash("correct horse battery staple", h), true);
  assert.equal(await auth.verifyPasswordHash("wrong", h), false);
});

test("hash is salted: same password gives different hashes", async () => {
  const a = await auth.hashPassword("same-password-123");
  const b = await auth.hashPassword("same-password-123");
  assert.notEqual(a, b);
});

test("malformed or weak-parameter hashes are rejected", async () => {
  assert.equal(await auth.verifyPasswordHash("x", "garbage"), false);
  assert.equal(await auth.verifyPasswordHash("x", "scrypt$2$8$1$AAAA$AAAA"), false);
});

test("session: sign, verify, tamper, expiry", () => {
  const good = `founder-auth=${encodeURIComponent(auth.signSession(60))}`;
  assert.equal(auth.verifySession(good), true);
  assert.equal(auth.verifySession(good.slice(0, -2) + "00"), false);
  assert.equal(auth.verifySession(`founder-auth=${encodeURIComponent(auth.signSession(-10))}`), false);
  assert.equal(auth.verifySession(null), false);
  assert.equal(auth.verifySession("founder-auth=abc"), false);
});

test("edge verifier accepts exactly what the node signer issues (and the __Host- name)", async () => {
  const tok = encodeURIComponent(auth.signSession(60));
  assert.equal(await edge.verifySessionEdge(`__Host-founder-auth=${tok}`, "x".repeat(48)), true);
  assert.equal(await edge.verifySessionEdge(`founder-auth=${tok}`, "x".repeat(48)), true);
  assert.equal(await edge.verifySessionEdge(`founder-auth=${tok}`, "y".repeat(48)), false);
  assert.equal(await edge.verifySessionEdge(`founder-auth=${tok}`, "short"), false);
});