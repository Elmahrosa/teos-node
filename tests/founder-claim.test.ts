import test from "node:test";
import assert from "node:assert/strict";

// No Redis env in tests: the registry falls back to its in-memory map.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const claim = await import("../lib/founderClaim");
const registry = await import("../lib/registry");

const FOUNDER = "5qMY8s6bYbTqQe6nSf5p1rWjVq1q6pQ4mM7oWf2cGjcT";
const OTHER = "yPodsv8S5kUjc4kU91Wf4jna5iHsr5MP8R4We5yq8Ji";

test("claim message binds action, owner, names and nonce", () => {
  const msg = claim.buildClaimMessage("family", ["ashraf", "anas"], OTHER, "abcdefghijklmnop");
  assert.equal(
    msg,
    "TEOS founder claim v1:family\nowner:yPodsv8S5kUjc4kU91Wf4jna5iHsr5MP8R4We5yq8Ji\nnames:ashraf,anas\nnonce:abcdefghijklmnop"
  );
  // Any changed field changes the bytes the wallet signs.
  assert.notEqual(msg, claim.buildClaimMessage("claim", ["ashraf", "anas"], OTHER, "abcdefghijklmnop"));
  assert.notEqual(msg, claim.buildClaimMessage("family", ["ashraf"], OTHER, "abcdefghijklmnop"));
  assert.notEqual(msg, claim.buildClaimMessage("family", ["ashraf", "anas"], FOUNDER, "abcdefghijklmnop"));
  assert.notEqual(msg, claim.buildClaimMessage("family", ["ashraf", "anas"], OTHER, "ponmlkjihgfedcba"));
});

test("parseClaimNames: strips .teos, lowercases, dedupes, rejects bad input", () => {
  assert.deepEqual(claim.parseClaimNames(["Ashraf", "ashraf.teos", "anas"]), ["ashraf", "anas"]);
  assert.equal(claim.parseClaimNames([]), null);
  assert.equal(claim.parseClaimNames("ashraf"), null);
  assert.equal(claim.parseClaimNames(["has space"]), null);
  assert.equal(claim.parseClaimNames(["has.dot"]), null);
  assert.equal(claim.parseClaimNames(["a".repeat(31)]), null);
  assert.equal(claim.parseClaimNames(Array.from({ length: 21 }, (_, i) => `n${i}`)), null);
});

test("nonce shape and public-key shape are validated", () => {
  assert.equal(claim.nonceOk("abcdefghijklmnop"), true);
  assert.equal(claim.nonceOk("short"), false);
  assert.equal(claim.nonceOk("bad nonce with spaces"), false);
  assert.equal(claim.isPublicKey(OTHER), true);
  assert.equal(claim.isPublicKey("not-a-key"), false);
  assert.equal(claim.isPublicKey(123), false);
});

test("admin claim allows sealed family names, still blocks the founder identity", async () => {
  // ashraf is sealed in domains/reserved-list.json (family, brother).
  assert.equal(await registry.adminClaimDomain("ashraf", OTHER, "t1"), true);
  // A second claim on the same name is refused.
  assert.equal(await registry.adminClaimDomain("ashraf", OTHER, "t2"), false);
  // ayman stays NOT_FOR_SALE even for the admin path.
  assert.equal(await registry.adminClaimDomain("ayman", OTHER, "t3"), false);
});

test("public claim path still refuses sealed names", async () => {
  // amira is sealed (family, sister): the normal purchase path must refuse it.
  assert.equal(await registry.claimDomain("amira", OTHER, "t4"), false);
});

test("nonce is one-time", async () => {
  assert.equal(await registry.useNonce("nonce-one-time-0001"), true);
  assert.equal(await registry.useNonce("nonce-one-time-0001"), false);
});
