import test from "node:test";
import assert from "node:assert/strict";
import { buildCsp } from "../lib/csp";
import { hitMemory } from "../lib/rate-limit";
import { pickClientIp } from "../lib/client-ip";
import { sameOrigin } from "../lib/origin";

test("production CSP: nonce + strict-dynamic, no unsafe-eval, no bare https: in script-src", () => {
  const csp = buildCsp("abc123", false);
  const script = csp.split("; ").find((d) => d.startsWith("script-src "))!;
  assert.ok(script.includes("'nonce-abc123'") && script.includes("'strict-dynamic'"));
  assert.ok(!script.includes("unsafe-eval") && !script.includes("unsafe-inline") && !/\shttps:/.test(script));
  for (const d of ["frame-ancestors 'self'", "base-uri 'self'", "form-action 'self'", "object-src 'none'", "upgrade-insecure-requests"]) assert.ok(csp.includes(d), d);
});

test("dev CSP may use unsafe-eval (React refresh) but production never does", () => {
  assert.ok(buildCsp("n", true).includes("'unsafe-eval'"));
  assert.ok(!buildCsp("n", false).includes("'unsafe-eval'"));
});

test("memory rate limiter blocks after the limit and resets after the window", () => {
  const m = new Map();
  const t0 = 1_000_000;
  for (let i = 0; i < 5; i++) assert.equal(hitMemory(m, "k", 5, 60, t0).allowed, true);
  assert.equal(hitMemory(m, "k", 5, 60, t0 + 1000).allowed, false);
  assert.equal(hitMemory(m, "k", 5, 60, t0 + 61_000).allowed, true);
  assert.equal(hitMemory(m, "other", 5, 60, t0).allowed, true);
});

test("client IP prefers x-real-ip, else the last X-Forwarded-For hop (spoofed prefixes are ignored)", () => {
  assert.equal(pickClientIp("1.1.1.1, 9.9.9.9, 10.0.0.1", null), "10.0.0.1");
  assert.equal(pickClientIp("6.6.6.6, 1.1.1.1, 9.9.9.9, 10.0.0.1", null), "10.0.0.1");
  assert.equal(pickClientIp("1.1.1.1, 10.0.0.1", "2.2.2.2"), "2.2.2.2");
  assert.equal(pickClientIp(null, "2.2.2.2"), "2.2.2.2");
  assert.equal(pickClientIp(null, null), "unknown");
});

test("sameOrigin accepts own origin and rejects others", () => {
  const mk = (h: Record<string, string>) => new Request("https://web4.elmahrosa.org/api/x", { method: "POST", headers: h });
  assert.equal(sameOrigin(mk({ host: "web4.elmahrosa.org", origin: "https://web4.elmahrosa.org" })), true);
  assert.equal(sameOrigin(mk({ host: "web4.elmahrosa.org", origin: "https://evil.example" })), false);
  assert.equal(sameOrigin(mk({ host: "web4.elmahrosa.org" })), false);
  assert.equal(sameOrigin(mk({ host: "web4.elmahrosa.org", "sec-fetch-site": "same-origin" })), true);
});