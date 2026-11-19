#!/usr/bin/env node
// TEOS launch preflight: verifies a deployment end-to-end, not just that it renders.
//
// Usage:
//   node scripts/preflight.mjs                                  # checks https://teos-node.vercel.app
//   node scripts/preflight.mjs https://web4.elmahrosa.org
//   PREFLIGHT_BASE=https://... node scripts/preflight.mjs
//
// Exit 0 = ready, 1 = at least one FAIL. No dependencies, Node 22+.

const BASE = (process.argv[2] || process.env.PREFLIGHT_BASE || "https://teos-node.vercel.app").replace(/\/+$/, "");
const rows = [];
const add = (name, ok, detail = "") => rows.push({ name, ok, detail });

const HERO_EN = "Your Name. Your Identity. Your Ownership.";
const STALE_SEO = "make a website for your company";
const HEX32 = /^[0-9a-f]{32}$/i;

async function get(path) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  const text = await res.text();
  return { res, text, type: res.headers.get("content-type") || "" };
}

async function main() {
  console.log(`preflight -> ${BASE}\n`);

  // 1. Platform identity: which host is actually answering.
  try {
    const { res } = await get("/");
    const railway = res.headers.get("x-railway-request-id");
    const vercel = res.headers.get("x-vercel-id");
    const server = res.headers.get("server") || "";
    const platform = railway ? "railway" : vercel ? "vercel" : server || "unknown";
    add("platform reachable", res.status === 200, `status=${res.status} platform=${platform}`);
  } catch (e) {
    add("platform reachable", false, String(e));
  }

  // 2. Homepage: Phase 1 content, and the stale website-creation claim gone from meta/JSON-LD.
  try {
    const { res, text } = await get("/");
    add("homepage 200", res.status === 200, `status=${res.status}`);
    add("Phase 1 hero present", text.includes(HERO_EN), text.includes(HERO_EN) ? "found" : "MISSING");
    add("stale SEO claim removed", !text.includes(STALE_SEO), text.includes(STALE_SEO) ? "still in meta/JSON-LD" : "clean");
  } catch (e) {
    add("homepage 200", false, String(e));
  }

  // 3. Liveness must be 200 everywhere. Readiness is allowed to be 503 until env is complete.
  for (const p of ["/api/live", "/api/health"]) {
    try {
      const { res, text } = await get(p);
      const detail = `status=${res.status} body=${text.slice(0, 120)}`;
      if (p === "/api/live") add("/api/live 200", res.status === 200, detail);
      else add("/api/health readable", res.status === 200 || res.status === 503, detail);
    } catch (e) {
      add(p, false, String(e));
    }
  }

  // 4. Pi domain verification key: 32 hex chars, text/plain, no trailing newline.
  try {
    const { res, text, type } = await get("/validation-key.txt");
    add("validation-key.txt 200", res.status === 200, `status=${res.status}`);
    add("validation-key.txt text/plain", type.includes("text/plain"), type || "(none)");
    add("validation-key.txt 32 hex/no newline", HEX32.test(text) && text.length === 32, `len=${text.length} value=${text.slice(0, 8)}...`);
  } catch (e) {
    add("validation-key.txt", false, String(e));
  }

  // 5. Core pages.
  for (const p of ["/browser", "/wallet", "/builder/demo"]) {
    try {
      const { res } = await get(p);
      add(`${p} 200`, res.status === 200, `status=${res.status}`);
    } catch (e) {
      add(`${p} 200`, false, String(e));
    }
  }

  // 6. Wallet API (needs Helius DAS; free tier is enough).
  try {
    const { res, text } = await get("/api/wallet/summary?wallet=11111111111111111111111111111111");
    add("/api/wallet/summary 200", res.status === 200, `status=${res.status} body=${text.slice(0, 100)}`);
  } catch (e) {
    add("/api/wallet/summary", false, String(e));
  }

  // 7. Site store: 404 "no_site" is healthy; 503 means Upstash is missing.
  for (const p of ["/api/site/demo", "/api/site/demo/manifest"]) {
    try {
      const { res, text } = await get(p);
      const ok = res.status === 200 || (res.status === 404 && text.includes("no_site"));
      add(`${p} healthy`, ok, `status=${res.status} body=${text.slice(0, 80)}`);
    } catch (e) {
      add(`${p} healthy`, false, String(e));
    }
  }

  // 8. Local env is informational only: the real values live in Vercel/Railway.
  console.log("local env (informational - the deployed values are what matter):");
  for (const k of ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "HELIUS_API_KEY", "PUBLIC_BASE_URL"]) {
    console.log(`  ${process.env[k] ? "set    " : "missing"}  ${k}`);
  }
  console.log("");

  const pad = Math.max(...rows.map((r) => r.name.length));
  for (const r of rows) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(pad)}  ${r.detail}`);
  const failed = rows.filter((r) => !r.ok);
  console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
