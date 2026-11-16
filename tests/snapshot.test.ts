import test from "node:test";
import assert from "node:assert/strict";

const { cidV1Raw, isCidV1Raw } = await import("../lib/ipfs");
const { renderSiteSnapshot, snapshotOf, SNAPSHOT_FORMAT } = await import("../lib/site-snapshot");
const { EMPTY_SITE, sanitizeSite, sitePublishMessage } = await import("../lib/sites");

const site = {
  ...EMPTY_SITE,
  title: "Ayman TEOS",
  tagline: "Sovereign identity",
  theme: "gold" as const,
  sections: [{ heading: "About", body: "Line one\nLine two" }],
  links: [{ label: "Site", url: "https://example.com" }],
};

test("CIDv1 raw: matches the well-known empty-block vector", () => {
  // sha256("") = e3b0c442... and CIDv1 raw/base32 of it is a public constant.
  assert.equal(cidV1Raw(""), "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku");
  assert.ok(isCidV1Raw(cidV1Raw("")));
  assert.ok(!isCidV1Raw("bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvykU"));
  assert.ok(!isCidV1Raw("QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"));
  assert.ok(!isCidV1Raw(""));
  assert.ok(!isCidV1Raw(null));
});

test("snapshot: deterministic, and its hash names its own bytes", () => {
  const a = snapshotOf("ayman", site);
  const b = snapshotOf("ayman", site);
  assert.equal(a.html, b.html);
  assert.equal(a.cid, b.cid);
  assert.equal(a.sha256, b.sha256);
  assert.equal(a.cid, cidV1Raw(a.html));
  assert.equal(a.sha256.length, 64);
  assert.equal(a.bytes, Buffer.byteLength(a.html, "utf8"));
  assert.equal(a.bytes, a.html.length); // ASCII-only fixture
  assert.match(a.html, new RegExp(`<meta name="teos:format" content="${SNAPSHOT_FORMAT}">`));

  const changed = snapshotOf("ayman", { ...site, tagline: "Something else" });
  assert.notEqual(changed.cid, a.cid);
  const renamed = snapshotOf("other", site);
  assert.notEqual(renamed.cid, a.cid);
});

test("snapshot: byte length counts UTF-8, not characters", () => {
  const arabic = snapshotOf("ayman", { ...site, tagline: "مرحبا بالعالم" });
  assert.ok(arabic.bytes > arabic.html.length);
  assert.equal(arabic.bytes, Buffer.byteLength(arabic.html, "utf8"));
});

test("snapshot: site data is escaped, never markup", () => {
  const hostile = sanitizeSite({
    title: '<script>alert(1)</script>',
    tagline: '</title><img src=x onerror=alert(2)>',
    image: 'javascript:alert(3)',
    sections: [{ heading: "<b>h</b>", body: 'a & b < c "quoted" \'single\'' }],
    links: [{ label: '</a><script>bad()</script>', url: "javascript:alert(4)" }],
  });
  const html = renderSiteSnapshot("ayman", hostile);
  assert.ok(!html.includes("<script"));
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;img src=x onerror=alert(2)&gt;"));
  assert.ok(!html.includes("javascript:"));
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(html.includes("&amp;"));
  assert.ok(html.includes("&quot;"));
  assert.ok(html.includes("&#39;"));
  assert.ok(html.includes("&lt;b&gt;h&lt;/b&gt;"));
  // javascript: URLs are dropped by sanitizeSite, so the link disappears entirely.
  assert.ok(!html.includes("<nav>"));
});

test("snapshot: only https images survive sanitizing", () => {
  const kept = sanitizeSite({ ...site, image: "https://example.com/a.png" });
  assert.ok(renderSiteSnapshot("ayman", kept).includes('<img class="hero" src="https://example.com/a.png"'));
  const dropped = sanitizeSite({ ...site, image: "http://example.com/a.png" });
  assert.ok(!renderSiteSnapshot("ayman", dropped).includes("<img"));
});

test("publish message: the signed payload commits to the CID", () => {
  const cid = cidV1Raw("abc");
  assert.equal(sitePublishMessage("ayman", 123, "h".repeat(64), cid), `teos://site/ayman/123/${"h".repeat(64)}/${cid}`);
  assert.ok(sitePublishMessage("ayman", 123, "h", cid).endsWith(cid));
});
