import { lookup } from "node:dns/promises";
import { safeUrl, sanitizeSite, type SiteConfig, type SiteLink, type SiteSection } from "./sites";

// Imports the *content* of a site the user already owns (title, tagline, image, text, links).
// It never returns HTML that we later render: everything goes through sanitizeSite and is shown as
// React text, so an imported page cannot inject markup or script into the TEOS origin.

const MAX_HTML_BYTES = 400_000;
const TIMEOUT_MS = 8_000;

export class ImportError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => {
      const n = Number(d);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const n = parseInt(h, 16);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function text(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function meta(html: string, key: string): string {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const a = new RegExp(`<meta[^>]+(?:name|property)\\s*=\\s*["']${esc}["'][^>]*content\\s*=\\s*["']([^"']*)["']`, "i");
  const b = new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]*(?:name|property)\\s*=\\s*["']${esc}["']`, "i");
  const m = html.match(a) ?? html.match(b);
  return m ? decodeEntities(m[1]) : "";
}

function sectionsOf(html: string): SiteSection[] {
  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ");
  const blocks = body.match(/<(h[1-3]|p)\b[^>]*>[\s\S]*?<\/\1>/gi) ?? [];
  const out: SiteSection[] = [];
  let heading = "";
  let para = "";
  const flush = () => {
    const b = para.trim();
    if (heading || b) out.push({ heading: heading.slice(0, 80), body: b.slice(0, 2000) });
    heading = "";
    para = "";
  };
  for (const block of blocks) {
    const tag = (block.match(/^<([a-z0-9]+)/i)?.[1] ?? "").toLowerCase();
    const t = text(block);
    if (!t) continue;
    if (tag.startsWith("h")) {
      if (heading || para.trim().length > 40) flush();
      heading = t;
    } else {
      // Short paragraphs are navigation, buttons and captions, not site content.
      if (t.length < 40) continue;
      para += (para ? "\n\n" : "") + t;
      if (para.length > 2000) flush();
    }
    if (out.length >= 6) break;
  }
  flush();
  return out.slice(0, 6);
}

function linksOf(html: string, base: URL): SiteLink[] {
  const out: SiteLink[] = [];
  const seen = new Set<string>();
  const skip = /^(home|menu|login|log in|sign in|sign up|next|previous|prev|back|more|read more|contact)$/i;
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 8) {
    const label = text(m[2]).slice(0, 60).trim();
    if (label.length < 2 || skip.test(label)) continue;
    // Same-page anchors and non-http schemes are not useful site links.
    if (m[1].trim().startsWith("#")) continue;
    let absolute: URL;
    try {
      absolute = new URL(m[1], base);
    } catch {
      continue;
    }
    const url = safeUrl(absolute.toString());
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ label, url });
  }
  return out;
}

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  // IPv6 literals and anything that is not a plain hostname are refused.
  if (h.startsWith("[")) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

// A public hostname can still point at a private address (nip.io, sslip.io, DNS rebinding), so the
// name is resolved before fetching and every answer must be public. Literal private hosts were
// already rejected; this covers the DNS path.
function isPrivateIp(ip: string): boolean {
  const v = ip.toLowerCase().split("%")[0];
  if (v.includes(":")) {
    if (v === "::" || v === "::1") return true;
    if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
    return v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb");
  }
  const p = v.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  return (
    p[0] === 0 ||
    p[0] === 10 ||
    p[0] === 127 ||
    p[0] === 169 && p[1] === 254 ||
    p[0] === 172 && p[1] >= 16 && p[1] <= 31 ||
    p[0] === 192 && p[1] === 168 ||
    p[0] === 100 && p[1] >= 64 && p[1] <= 127
  );
}

async function assertPublicHost(u: URL): Promise<void> {
  let answers: { address: string }[];
  try {
    answers = await lookup(u.hostname, { all: true });
  } catch {
    throw new ImportError("fetch_failed");
  }
  if (!answers.length || answers.some((a) => isPrivateIp(a.address))) throw new ImportError("private_host");
}

export function normalizeImportUrl(raw: unknown): URL {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s || s.length > 500) throw new ImportError("bad_url");
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new ImportError("bad_url");
  }
  if (u.protocol !== "https:") throw new ImportError("https_required");
  if (u.username || u.password) throw new ImportError("bad_url");
  if (u.port && u.port !== "443") throw new ImportError("bad_url");
  if (isPrivateHost(u.hostname)) throw new ImportError("private_host");
  return u;
}

async function fetchHtml(u: URL): Promise<string> {
  await assertPublicHost(u);
  let res: Response;
  try {
    res = await fetch(u, {
      redirect: "manual",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "TEOS-Importer/1.0 (+https://web4.elmahrosa.org)",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new ImportError("fetch_failed");
  }
  // Redirects could point at an internal address, so a redirect is an error rather than followed.
  if (res.status >= 300 && res.status < 400) throw new ImportError("redirect_not_allowed");
  if (!res.ok) throw new ImportError("fetch_failed");
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("text/html") && !type.includes("application/xhtml")) throw new ImportError("not_html");
  const declared = Number(res.headers.get("content-length") || 0);
  if (declared > MAX_HTML_BYTES) throw new ImportError("too_large");
  // Read with a hard cap: a chunked response cannot make us buffer an unbounded body.
  const reader = res.body?.getReader();
  if (!reader) throw new ImportError("fetch_failed");
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read().catch(() => {
      throw new ImportError("fetch_failed");
    });
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_HTML_BYTES) {
      reader.cancel().catch(() => {});
      throw new ImportError("too_large");
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

export async function importSiteFromUrl(raw: unknown): Promise<SiteConfig> {
  const base = normalizeImportUrl(raw);
  const html = await fetchHtml(base);
  const titleTag = text(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const tagline = meta(html, "og:description") || meta(html, "description");
  const image = safeUrl(meta(html, "og:image") || meta(html, "twitter:image"));
  const sections = sectionsOf(html);
  return sanitizeSite({
    title: meta(html, "og:title") || titleTag || base.hostname,
    tagline,
    image,
    theme: "gold",
    sections: sections.length ? sections : [{ heading: "About", body: tagline }],
    links: linksOf(html, base),
  });
}
