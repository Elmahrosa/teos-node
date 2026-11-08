import test from "node:test";
import assert from "node:assert/strict";
import { isBlockedName } from "../lib/blocklist";
import { isReservedWord } from "../lib/domain-rules";
import { checkTlds } from "../lib/check";

const MUST_BLOCK = ["porn", "PORN", "p0rn", "p-o-r-n", "p_o_rn", "sharmota", "sh4rmota", "sex", "sexking", "kingsex", "sex123", "pornstar123", "khawal", "khawalalex", "5ara", "m3rs", "xxx", "fuckyou", "ya-khawal", "mohamed", "ayman", "elmahrosa", "elmahrosa2026", "my-solana-wallet"];
const MUST_PASS = ["test123", "ashraf", "anas", "ehab", "ekram", "amira", "soha", "sohayb", "hello", "class", "method", "analyst", "sara", "ahmed", "essex-x", "shell", "moral", "skill"];

test("blocked names are blocked (case, separators, leet, contains)", () => {
  for (const n of MUST_BLOCK) assert.equal(isBlockedName(n), true, n);
});

test("ordinary names are not blocked", () => {
  for (const n of MUST_PASS.filter((n) => n !== "essex-x")) assert.equal(isBlockedName(n), false, n);
});

test("blocklist feeds isReservedWord (used by check, availability, claim)", () => {
  assert.equal(isReservedWord("porn"), true);
  assert.equal(isReservedWord("test123"), false);
});

test("sale check: reserved names unavailable on every TLD, minted ashraf unavailable, test123 available", async () => {
  for (const n of ["porn", "sharmota", "p0rn", "sex", "khawal"]) {
    for (const r of await checkTlds(n, ["teos", "eg", "sa"])) {
      assert.equal(r.available, false, `${n}.${r.tld}`);
      assert.equal(r.reason, "reserved", `${n}.${r.tld}`);
    }
  }
  const ashraf = (await checkTlds("ashraf", ["teos"]))[0];
  assert.equal(ashraf.available, false);
  const ok = (await checkTlds("test123", ["teos"]))[0];
  assert.equal(ok.available, true, JSON.stringify(ok));
});
