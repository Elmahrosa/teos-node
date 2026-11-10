import test from "node:test";
import assert from "node:assert/strict";
import { buildTldRows, isProtectedName } from "../lib/dashboard";
import { claimDomain } from "../lib/registry";

test("dashboard rows: all 127 namespaces, priced, founder names never available", async () => {
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

test("owner route goes to the dashboard, everyone else to /buy", async () => {
  const { getRouteForUser } = await import("../lib/domain");
  assert.equal(getRouteForUser("ahmed", "W1", "W1"), "/dashboard/ahmed");
  assert.equal(getRouteForUser("ahmed.teos", "W1", "W2"), "/buy/ahmed");
  assert.equal(getRouteForUser("ahmed", null, "W2"), "/buy/ahmed");
});
