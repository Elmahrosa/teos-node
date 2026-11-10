import test from "node:test";
import assert from "node:assert/strict";
import { lockEndFor, secondsLeft, LOCK_MS, REFRESH_MARGIN_MS } from "../lib/quoteLock";

const NOW = 1_700_000_000_000;

test("lock is 5 minutes and matches the server quote TTL default", () => {
  assert.equal(LOCK_MS, 300_000);
  assert.equal(Number(process.env.QUOTE_TTL_SECONDS ?? 300) * 1000, LOCK_MS);
});

test("fresh quote expiring at exactly now+300s: countdown ends before expiry, never at it", () => {
  const expires = NOW + 300_000;
  const end = lockEndFor(NOW, expires);
  assert.ok(end <= expires - REFRESH_MARGIN_MS);
  assert.equal(secondsLeft(NOW, end), 295);
  // at the 5-minute mark the countdown has already hit zero (refresh fired earlier)
  assert.equal(secondsLeft(expires, end), 0);
  assert.equal(secondsLeft(expires - REFRESH_MARGIN_MS, end), 0);
});

test("quote with a long TTL is capped at 5 minutes", () => {
  assert.equal(lockEndFor(NOW, NOW + 3_600_000), NOW + LOCK_MS);
});

test("near-expired or already expired quote gets a 1 s minimum, not a refresh loop", () => {
  assert.equal(lockEndFor(NOW, NOW + 2_000), NOW + 1000);
  assert.equal(lockEndFor(NOW, NOW - 10_000), NOW + 1000);
  assert.equal(secondsLeft(NOW, NOW + 1000), 1);
});

test("secondsLeft rounds up and clamps at zero", () => {
  assert.equal(secondsLeft(NOW, NOW + 1), 1);
  assert.equal(secondsLeft(NOW, NOW + 1500), 2);
  assert.equal(secondsLeft(NOW, NOW), 0);
  assert.equal(secondsLeft(NOW + 5000, NOW), 0);
});

test("a quote refreshed at the boundary starts a new full window", () => {
  const t = NOW + 295_000; // refresh fires 5 s before the old expiry
  const fresh = lockEndFor(t, t + 300_000);
  assert.equal(secondsLeft(t, fresh), 295);
});
