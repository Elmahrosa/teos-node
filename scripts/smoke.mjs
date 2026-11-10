// Launch smoke test. Run against a deployed (or local) instance:
//   BASE=https://web4.elmahrosa.org node scripts/smoke.mjs
// Exit code 1 if any check fails. Makes one quote request (no payment, no mint).
const BASE = (process.env.BASE || "http://localhost:3000").replace(/\/$/, "");
let fail = 0;
const ok = (n, c, d = "") => { console.log(`${c ? "PASS" : "FAIL"}  ${n}${d ? "  " + d : ""}`); if (!c) fail++; };
const j = async (path, init) => {
  const r = await fetch(BASE + path, init);
  return { r, body: await r.json().catch(() => null) };
};
const post = (path, body, headers = {}) => j(path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

// 1. Reserved / sealed names must be unbuyable on every namespace.
for (const n of ["fed", "ecb", "cbe", "amira", "ashraf", "google", "anthropic"]) {
  const { body } = await j(`/api/check?name=${n}`);
  const all = body?.results?.length > 0 && body.results.every((x) => x.available === false);
  ok(`check ${n}.* blocked on all namespaces`, all);
  const q = await post("/api/quote", { domain: n });
  ok(`quote ${n} refused`, q.body?.available === false && !q.body?.quote_id);
}

// 2. A normal name quotes, and the quote carries a treasury + price.
const probe = "smoke" + Math.random().toString(36).slice(2, 8);
const q = await post("/api/quote", { domain: probe });
ok("quote for fresh name", !!q.body?.quote_id && q.body?.price_lamports > 0, JSON.stringify({ usd: q.body?.price_usd, sol: q.body?.price_sol }));
ok("quote has pay_to wallet", typeof q.body?.pay_to === "string" && q.body.pay_to.length >= 32);
ok("quote message format", String(q.body?.message_to_sign).startsWith(`teos://register/${probe}.teos/`));

// 3. Register must reject garbage (503 if closed, 4xx if open). Never 200.
const bad = await post("/api/register", { domain: probe, quote_id: "x", signature: "x", publicKey: "x", payment_tx: "x" });
ok("register rejects garbage", bad.r.status >= 400, `status ${bad.r.status}`);

// 4. Admin surfaces must require the founder session.
ok("admin/grant requires auth", (await post("/api/admin/grant", { name: "abcde", wallet: "x" })).r.status === 401);
ok("visits requires auth", (await j("/api/visits")).r.status === 401);

// 5. Refund endpoint caps input (should accept but not error on oversized input).
const rf = await post("/api/refund-request", { signature: "s".repeat(5000), wallet: "w".repeat(5000), reason: "r".repeat(5000) });
ok("refund-request tolerates oversized input", [202, 503].includes(rf.r.status), `status ${rf.r.status}`);

// 6. Headers.
const home = await fetch(BASE + "/");
ok("homepage 200", home.status === 200);
ok("CSP header", !!home.headers.get("content-security-policy"));
ok("HSTS header", !!home.headers.get("strict-transport-security"));
ok("X-Frame-Options SAMEORIGIN", home.headers.get("x-frame-options") === "SAMEORIGIN");
for (const p of ["/terms", "/privacy"]) ok(`${p} 200`, (await fetch(BASE + p)).status === 200);

// 7. Health (public view is ok/not-ok only).
const h = await j("/api/health");
ok("health: all launch prerequisites present", h.body?.ok === true, `status ${h.r.status}`);

console.log(fail ? `\n${fail} check(s) failed. Do not launch.` : "\nAll checks passed.");
process.exit(fail ? 1 : 0);
