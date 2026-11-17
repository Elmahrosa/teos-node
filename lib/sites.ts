
// Site configs are plain data, never HTML. Everything is validated here and rendered as React text,
// so a published site cannot inject script or markup into the TEOS origin.
export const THEMES = ["gold", "midnight", "emerald", "light"] as const;
export type Theme = (typeof THEMES)[number];
export type SiteLink = { label: string; url: string };
export type SiteSection = { heading: string; body: string };
export type SiteConfig = {
  title: string;
  tagline: string;
  theme: Theme;
  image: string;
  sections: SiteSection[];
  links: SiteLink[];
};
export type StoredSite = SiteConfig & { owner: string; updatedAt: number };

export const EMPTY_SITE: SiteConfig = { title: "", tagline: "", theme: "gold", image: "", sections: [{ heading: "About", body: "" }], links: [] };

// A safe starting point when an import cannot be read. Pure, so it also works before connecting a wallet.
export function defaultSiteTemplate(name: string): SiteConfig {
  const label = String(name ?? "").trim().toLowerCase();
  return {
    title: `${label}.teos`,
    tagline: `The official home of ${label}.teos.`,
    theme: "gold",
    image: "",
    sections: [{ heading: "About", body: `${label}.teos is a TEOS Web4 name on Solana. Edit this text to introduce yourself or your project.` }],
    links: [{ label: `${label}.teos`, url: `https://${label}.teos` }],
  };
}

// True when an import produced no usable content. A hostname fallback (importSiteFromUrl uses the URL host
// when the page has no <title>/og:title) is not a real title, so callers may pass the imported hostname.
// Used by the builder to say "read it manually" instead of claiming a successful import.
export function isEmptyImportedSite(site: Partial<SiteConfig> | null | undefined, hostname?: string): boolean {
  const has = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  const title = typeof site?.title === "string" ? site.title.trim() : "";
  const host = String(hostname ?? "").trim().toLowerCase().replace(/\.$/, "");
  const titleIsPlaceholder = !!host && title.toLowerCase().replace(/\.$/, "") === host;
  const sections = Array.isArray(site?.sections) ? site.sections : [];
  const links = Array.isArray(site?.links) ? site.links : [];
  return (
    (!title || titleIsPlaceholder) &&
    !has(site?.tagline) &&
    !sections.some((s) => has(s?.body)) &&
    !links.some((l) => has(l?.label) && has(l?.url))
  );
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max) : "");

export function safeUrl(v: unknown): string {
  const s = str(v, 500);
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}

export function sanitizeSite(raw: any): SiteConfig {
  const theme = THEMES.includes(raw?.theme) ? (raw.theme as Theme) : "gold";
  const sections = (Array.isArray(raw?.sections) ? raw.sections : []).slice(0, 6)
    .map((s: any) => ({ heading: str(s?.heading, 80), body: str(s?.body, 2000) }))
    .filter((s: SiteSection) => s.heading || s.body);
  const links = (Array.isArray(raw?.links) ? raw.links : []).slice(0, 8)
    .map((l: any) => ({ label: str(l?.label, 60), url: safeUrl(l?.url) }))
    .filter((l: SiteLink) => l.label && l.url);
  return { title: str(raw?.title, 80), tagline: str(raw?.tagline, 160), theme, image: safeUrl(raw?.image), sections, links };
}

export const siteMessage = (name: string, ts: number, hash: string) => `teos://site/${name}/${ts}/${hash}`;
// Same publish, but the CID is inside the signed message. Only this form proves the owner chose the
// exact content that hash addresses, without trusting the server to compute it for them.
export const sitePublishMessage = (name: string, ts: number, hash: string, cid: string) => `${siteMessage(name, ts, hash)}/${cid}`;
export const importMessage = (name: string, ts: number, hash: string) => `teos://import/${name}/${ts}/${hash}`;
export const SITE_MAX_AGE_MS = 300_000;
