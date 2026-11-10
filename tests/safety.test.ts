import { sha256Hex } from "../lib/sha256";
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
  const hashes = new Set<string>(JSON.parse(fs.readFileSync("domains/protected-hashes.json", "utf8")).sha256);
  assert.ok(hashes.size >= 100, "protected hash list should not be empty");
  const norm = (s: string) => s.toUpperCase().trim().replace(/\.TEOS$/, "");
  const protectedHit = (s: string) => hashes.has(sha256Hex(norm(s)));
  // No plain brand names live in this test file. Optionally set BRAND_NAMES="a,b,c" locally to also assert specific names.
  const extra = (process.env.BRAND_NAMES || "").split(",").map((x) => x.trim()).filter(Boolean);
  for (const n of [...extra, "reserved-101"]) assert.equal(isSealedDomain(n), true, n);
  // Every token in the public lists must NOT hash into the protected set (a real name would).
  // These three are metadata file names that were sealed by basename; they are not institution names.
  const fileNames = new Set(["central-banks-reserve", "reserved-list", "sealed-list"]);
  const pubFiles = ["data/BRANDS-ONLY.txt", "domains/sealed-list.json"];
  for (const f of pubFiles) {
    for (const tok of fs.readFileSync(f, "utf8").split(/[^A-Za-z0-9-]+/).filter((t) => Boolean(t) && !fileNames.has(t))) {
      assert.equal(protectedHit(tok), false, `${f} contains a protected name`);
    }
  }
  // No per-brand file in domains/ may carry a protected name.
  for (const f of fs.readdirSync("domains").filter((x) => x.endsWith(".teos.json"))) {
    assert.equal(protectedHit(f.replace(/\.teos\.json$/, "")), false, `domains/${f} is a protected name`);
  }
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
