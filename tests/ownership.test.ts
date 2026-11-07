import test from "node:test";
import assert from "node:assert/strict";
import { ourTeosNames } from "../lib/ownership";
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
