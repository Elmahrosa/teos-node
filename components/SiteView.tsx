import type { SiteConfig, Theme } from "../lib/sites";

const PALETTE: Record<Theme, { bg: string; fg: string; accent: string; card: string }> = {
  gold: { bg: "#0b0b0b", fg: "#f5f5f5", accent: "#facc15", card: "rgba(180,130,30,0.12)" },
  midnight: { bg: "#0f172a", fg: "#e2e8f0", accent: "#38bdf8", card: "rgba(56,189,248,0.10)" },
  emerald: { bg: "#052e16", fg: "#ecfdf5", accent: "#34d399", card: "rgba(52,211,153,0.10)" },
  light: { bg: "#fafaf9", fg: "#1c1917", accent: "#b45309", card: "rgba(0,0,0,0.05)" },
};

// Pure presentational: used by /s/[name], the TEOS browser and the builder preview.
export default function SiteView({ name, site }: { name: string; site: SiteConfig }) {
  const p = PALETTE[site.theme] ?? PALETTE.gold;
  return (
    <div style={{ background: p.bg, color: p.fg, minHeight: "100%", padding: "40px 20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
        {site.image && <img src={site.image} alt="" referrerPolicy="no-referrer" style={{ maxWidth: "100%", maxHeight: 240, borderRadius: 12, marginBottom: 20 }} />}
        <h1 style={{ margin: 0, fontSize: 34, fontFamily: "Cinzel, Georgia, serif", color: p.accent, wordBreak: "break-word" }}>{site.title || `${name}.teos`}</h1>
        <p dir="ltr" style={{ margin: "6px 0 0", fontSize: 12, letterSpacing: 2, opacity: 0.6 }}>{name.toUpperCase()}.TEOS</p>
        {site.tagline && <p style={{ fontSize: 18, marginTop: 16 }}>{site.tagline}</p>}
        {site.sections.map((s, i) => (
          <section key={i} style={{ marginTop: 24, padding: 20, background: p.card, borderRadius: 12, textAlign: "start" }}>
            {s.heading && <h2 style={{ margin: "0 0 8px", fontSize: 20, color: p.accent }}>{s.heading}</h2>}
            <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, wordBreak: "break-word" }}>{s.body}</p>
          </section>
        ))}
        {site.links.length > 0 && (
          <nav style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
            {site.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer nofollow" style={{ display: "block", padding: "12px 16px", borderRadius: 10, border: `1px solid ${p.accent}`, color: p.accent, textDecoration: "none", fontWeight: 600 }}>{l.label}</a>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
