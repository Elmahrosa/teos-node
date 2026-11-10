import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { isSealedDomain } from "../lib/sealed";
import { displayName, canonicalName } from "../lib/display";

test("reserved institutional names stay unbuyable without being listed in the repo", () => {
  for (const n of ["RESERVED-01", "reserved-14.teos", "RESERVED-ROOT", "RESERVED-L05", "RESERVED-L10"]) assert.equal(isSealedDomain(n), true, n);
  // Real names are matched by hash only. Set BANK_NAMES=a,b,c to assert them locally without committing them.
  for (const n of (process.env.BANK_NAMES || "").split(",").filter(Boolean)) assert.equal(isSealedDomain(n), true, n);
  assert.equal(isSealedDomain("RESERVED-01"), true);
  assert.equal(isSealedDomain("test123xyz"), false);
});

test("brand names are sealed by hash and absent from public lists", () => {
  for (const n of ["apple", "facebook", "adcb", "mastercard", "reserved-101"]) assert.equal(isSealedDomain(n), true, n);
  const pub = fs.readFileSync("data/BRANDS-ONLY.txt", "utf8") + fs.readFileSync("domains/sealed-list.json", "utf8");
  assert.doesNotMatch(pub, /\b(apple|facebook|mastercard|vodafone|aramco)\b/i);
  assert.equal(fs.existsSync("domains/apple.teos.json"), false);
});

test("public files carry no central bank names", () => {
  const files = ["README.md", "ELM-STANDARD.md", "domains/central-banks-reserve.json", "domains/reserved-list.json"];
  for (const f of files) assert.doesNotMatch(fs.readFileSync(f, "utf8"), /"(?:domain|bank|name)":\s*"(?!RESERVED-)[A-Z]{2,}[A-Za-z .]*"/, f);
});

test("UI names use the short form; the full form is canonical only", () => {
  assert.equal(displayName("ahmed", "eg"), "ahmed.eg");
  assert.equal(canonicalName("ahmed", "eg"), "ahmed.eg.teos");
  assert.equal(canonicalName("ahmed", "teos"), "ahmed.teos");
});

test("tlds/all.json alias still resolves to namespaces/all.json", () => {
  assert.deepEqual(JSON.parse(fs.readFileSync("tlds/all.json", "utf8")), JSON.parse(fs.readFileSync("namespaces/all.json", "utf8")));
});

test("sha256Hex matches node crypto", async () => {
  const { createHash } = await import("node:crypto");
  const { sha256Hex } = await import("../lib/sha256");
  for (const s of ["", "abc", "RESERVED-01", "x".repeat(55), "x".repeat(56), "x".repeat(130)]) assert.equal(sha256Hex(s), createHash("sha256").update(s).digest("hex"));
});
