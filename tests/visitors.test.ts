import test from "node:test";
import assert from "node:assert/strict";
import { buildStats, countryFromHeaders, flagOf, recordVisit, getStats, UNKNOWN } from "../lib/visitors";

const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });

test("country comes from geo headers only, invalid values become unknown", () => {
  assert.equal(countryFromHeaders(h({ "cf-ipcountry": "eg" })), "EG");
  assert.equal(countryFromHeaders(h({ "x-vercel-ip-country": "SA" })), "SA");
  assert.equal(countryFromHeaders(h({ "cf-ipcountry": "XX" })), UNKNOWN);
  assert.equal(countryFromHeaders(h({ "x-forwarded-for": "1.2.3.4" })), UNKNOWN);
  assert.equal(countryFromHeaders(h({})), UNKNOWN);
});

test("flag emoji", () => {
  assert.equal(flagOf("EG"), "🇪🇬");
  assert.equal(flagOf(UNKNOWN), "🌐");
});

test("stats: sorted by visits, top 10, joined from members, unknown listed, no zero-visit rows", () => {
  const counts: Record<string, number> = { EG: 142, SA: 38, AE: 21, ZZ: 9 };
  for (let i = 0; i < 12; i++) counts[`Q${String.fromCharCode(65 + i)}`] = 1;
  const members = [{ name: "a", country: "EG", mint: null, joined: true as const, status: "sealed" as const }, { name: "b", country: "EG", mint: null, joined: true as const, status: "sealed" as const }];
  const s = buildStats(counts, members);
  assert.equal(s.top.length, 10);
  assert.deepEqual(s.top.slice(0, 3).map((r) => [r.code, r.visits, r.joined]), [["EG", 142, 2], ["SA", 38, 0], ["AE", 21, 0]]);
  assert.ok(s.top.some((r) => r.code === UNKNOWN));
  assert.ok(s.top.every((r) => r.visits > 0));
  assert.equal(buildStats({}, members).top.length, 0);
  assert.equal(s.total, 142 + 38 + 21 + 9 + 12);
  assert.equal(s.nations, 3 + 12);
  assert.equal(s.joined, 2);
});

test("recordVisit stores only a per-country total", async () => {
  await recordVisit("EG");
  await recordVisit("EG");
  const s = await getStats();
  assert.equal(s.top.find((r) => r.code === "EG")?.visits, 2);
  assert.deepEqual(Object.keys(s).sort(), ["joined", "nations", "top", "total"]);
});
