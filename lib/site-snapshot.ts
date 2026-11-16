// Deterministic, self-contained HTML copy of a published site.
// Why: /s/<name> is server-rendered from Redis, so it cannot be pinned or verified elsewhere.
// These exact bytes hash to a CIDv1, which the owner signs at publish time. Same bytes pinned
// anywhere later = same CID, so the manifest stays valid without touching this code.
//
// Rules for determinism: no timestamps, no randomness, no locale formatting, stable ordering,
// and the same theme palette as SiteView. Never insert unescaped site data into the markup.
import type { SiteConfig } from "./sites";
import { THEME_PALETTE } from "./themes";
import { cidV1Raw, utf8Bytes } from "./ipfs";
import { sha256Hex } from "./sha256";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const SNAPSHOT_FORMAT = "teos-snapshot/1";

export function renderSiteSnapshot(name: string, site: SiteConfig): string {
  const p = THEME_PALETTE[site.theme] ?? THEME_PALETTE.gold;
  const domain = `${name.toUpperCase()}.TEOS`;
  const title = site.title || `${name}.teos`;
  const out: string[] = [
    "<!doctype html>",
    `<html lang="en" dir="ltr">`,
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${esc(title)}</title>`,
    ...(site.tagline ? [`<meta name="description" content="${esc(site.tagline)}">`] : []),
    `<meta name="teos:name" content="${esc(domain)}">`,
    `<meta name="teos:format" content="${SNAPSHOT_FORMAT}">`,
    "<!--",
    "  Static TEOS snapshot. Verify it without trusting web4.elmahrosa.org:",
    "  sha256 of this file is the manifest `sha256`, and its CIDv1 is the manifest `cid`.",
    "-->",
    "<style>",
    `:root{--bg:${p.bg};--fg:${p.fg};--accent:${p.accent};--card:${p.card}}`,
    "*{box-sizing:border-box}",
    `body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 Georgia,'Times New Roman',serif}`,
    ".wrap{max-width:680px;margin:0 auto;padding:40px 20px;text-align:center}",
    ".hero{max-width:100%;max-height:240px;border-radius:12px;margin-bottom:20px}",
    "h1{margin:0;font-size:34px;color:var(--accent);word-break:break-word}",
    ".name{margin:6px 0 0;font-size:12px;letter-spacing:2px;opacity:.6;font-family:system-ui,sans-serif}",
    ".tagline{font-size:18px;margin-top:16px}",
    "section{margin-top:24px;padding:20px;background:var(--card);border-radius:12px;text-align:start}",
    "h2{margin:0 0 8px;font-size:20px;color:var(--accent)}",
    "section p{margin:0;white-space:pre-wrap;word-break:break-word}",
    "nav{margin-top:28px;display:flex;flex-direction:column;gap:10px}",
    "nav a{display:block;padding:12px 16px;border:1px solid var(--accent);border-radius:10px;color:var(--accent);text-decoration:none;font-weight:600;font-family:system-ui,sans-serif}",
    "</style>",
    "</head>",
    "<body>",
    '<div class="wrap">',
    ...(site.image ? [`<img class="hero" src="${esc(site.image)}" alt="" referrerpolicy="no-referrer">`] : []),
    `<h1>${esc(title)}</h1>`,
    `<p class="name">${esc(domain)}</p>`,
    ...(site.tagline ? [`<p class="tagline">${esc(site.tagline)}</p>`] : []),
    ...site.sections.flatMap((s) => {
      if (!s.heading && !s.body) return [];
      return ["<section>", ...(s.heading ? [`<h2>${esc(s.heading)}</h2>`] : []), ...(s.body ? [`<p>${esc(s.body)}</p>`] : []), "</section>"];
    }),
    ...(site.links.length
      ? ["<nav>", ...site.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer nofollow">${esc(l.label)}</a>`), "</nav>"]
      : []),
    "</div>",
    "</body>",
    "</html>",
  ];
  return out.join("\n") + "\n";
}

export type Snapshot = { html: string; sha256: string; cid: string; bytes: number };

export function snapshotOf(name: string, site: SiteConfig): Snapshot {
  const html = renderSiteSnapshot(name, site);
  return { html, sha256: sha256Hex(html), cid: cidV1Raw(html), bytes: utf8Bytes(html) };
}
