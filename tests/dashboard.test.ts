import test from "node:test";
import assert from "node:assert/strict";
import { buildTldRows, isProtectedName } from "../lib/dashboard";
import { claimDomain } from "../lib/registry";

test("dashboard rows: all 127 TLDs, priced, founder names never available", async () => {
  const rows = await buildTldRows("ahmedtest");
  assert.equal(rows.length, 127);
  assert.ok(rows.every((r) => r.price_usd > 0 && r.status === "available"));
  const eg = rows.find((r) => r.tld === "eg")!.price_usd, sa = rows.find((r) => r.tld === "sa")!.price_usd;
  assert.notEqual(eg, sa);
  const f = await buildTldRows("ayman");
  assert.equal(f.length, 127);
  assert.ok(f.every((r) => r.status === "reserved"));
  assert.ok(isProtectedName("ayman"));
});

test("dashboard rows: claimed name shows owned", async () => {
  await claimDomain("zed.eg", "w", "tx1");
  const rows = await buildTldRows("zed");
  assert.equal(rows.find((r) => r.tld === "eg")!.status, "owned");
  assert.equal(rows.find((r) => r.tld === "sa")!.status, "available");
});
