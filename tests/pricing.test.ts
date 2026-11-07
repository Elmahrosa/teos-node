import test from "node:test";
import assert from "node:assert/strict";
import all from "../tlds/all.json";
import pricing from "../core/pricing.json";
import { getPrice, getPriceOrNull, PriceMissingError } from "../lib/pricing";
import { SALE_TLDS, isSaleTld } from "../lib/tlds";

test("every live TLD in tlds/all.json has an explicit, existing price tier", () => {
  const tiers = pricing.tiers as Record<string, number[]>;
  const mapping = pricing.mapping as Record<string, string>;
  assert.equal(all.length, 127);
  for (const t of all) {
    assert.ok(mapping[t.tld], `no price tier for .${t.tld}`);
    assert.ok(tiers[mapping[t.tld]], `tier ${mapping[t.tld]} of .${t.tld} does not exist`);
    assert.equal(tiers[mapping[t.tld]].length, 5);
    assert.ok(getPrice("abcde", t.tld) > 0);
  }
});

test("an unpriced TLD has no price and is not for sale (no .teos fallback)", () => {
  assert.equal(getPriceOrNull("ahmed", "zz"), null);
  assert.throws(() => getPrice("ahmed", "zz"), PriceMissingError);
  assert.equal(isSaleTld("zz"), false);
  assert.ok(!("generic" in (pricing.tiers as object)));
});

test("all 127 TLDs are for sale and .teos keeps its own price", () => {
  assert.equal(SALE_TLDS.length, 127);
  assert.equal(getPrice("a", "teos"), 2000);
  assert.equal(getPrice("ahmed", "teos"), 30);
  assert.equal(getPrice("ahmed", "eg"), 60);
  assert.equal(getPrice("ahmed", "my"), 75);
});
