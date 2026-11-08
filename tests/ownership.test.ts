import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { ourTeosNames, trustedAuthorities } from "../lib/ownership";
import { recordMint } from "../lib/registry";

test("ownership without a collection: authority or registry mint, look-alikes rejected", async () => {
  process.env.TEOS_UPDATE_AUTHORITY = "AUTH1";
  await recordMint("zed", { asset: "ASSET_Z", signature: "s" });
  const items = [
    { id: "A1", content: { metadata: { name: "1.TEOS" } }, authorities: [{ address: "AUTH1" }] },
    { id: "ASSET_Z", content: { metadata: { name: "zed.teos" } }, authorities: [{ address: "other" }] },
    { id: "FAKE", content: { metadata: { name: "ahmed.teos" } }, authorities: [{ address: "attacker" }] },
    { id: "FAKE2", content: { metadata: { name: "zed.teos" } }, authorities: [{ address: "attacker" }] },
    { id: "X", content: { metadata: { name: "foo.sol" } }, authorities: [{ address: "AUTH1" }] },
  ];
  assert.deepEqual((await ourTeosNames(items)).sort(), ["1", "zed"]);
});

test("compromised authority (matched by SHA-256) fails closed instead of being trusted", async () => {
  // Use a FAKE key; never put the real compromised key in the repo.
  const fake = "11111111111111111111111111111111";
  const prevAuth = process.env.TEOS_UPDATE_AUTHORITY;
  const prevHash = process.env.COMPROMISED_AUTHORITY_HASH;
  process.env.TEOS_UPDATE_AUTHORITY = fake;
  process.env.COMPROMISED_AUTHORITY_HASH = createHash("sha256").update(fake, "utf8").digest("hex");
  try {
    await assert.rejects(trustedAuthorities(), /compromised authority/);
  } finally {
    if (prevAuth === undefined) delete process.env.TEOS_UPDATE_AUTHORITY;
    else process.env.TEOS_UPDATE_AUTHORITY = prevAuth;
    if (prevHash === undefined) delete process.env.COMPROMISED_AUTHORITY_HASH;
    else process.env.COMPROMISED_AUTHORITY_HASH = prevHash;
  }
});
