import { SOCIAL } from "../lib/social";
import { fmt, type Dict } from "../lib/i18n";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const GOLD = "#D4AF37";

const Ankh = ({ size = 22 }: { size?: number }) => (
  <svg aria-hidden="true" viewBox="0 0 40 70" width={size * 0.6} height={size} style={{ flexShrink: 0 }}>
    <g fill="none" stroke={GOLD} strokeWidth="5" strokeLinecap="round"><ellipse cx="20" cy="16" rx="11" ry="13" /><path d="M20 29V66M6 42H34" /></g>
  </svg>
);

// Six reasons, same stone-tablet look as the rest of the page. Code-only texture, no image files.
export default function WhyBuy({ t, countries, onCta }: { t: Dict; countries: number; onCta: () => void }) {
  const items = [
    { icon: "🔑", title: t.why1T, text: t.why1 },
    { icon: "🌍", title: fmt(t.why2T, { n: countries || "" }).trim(), text: t.why2 },
    { icon: "💰", title: t.why3T, text: t.why3 },
    { icon: "⚓", title: t.why4T, text: t.why4, link: SOCIAL.linkedin },
    { icon: "🔗", title: t.why5T, text: t.why5 },
    { icon: "📜", title: t.why6T, text: t.why6 },
  ];
  return (
    <section aria-labelledby="why" style={{ position: "relative", margin: "24px 0", padding: "28px 16px", borderTop: `2px solid ${GOLD}`, borderBottom: `2px solid ${GOLD}`, background: "linear-gradient(180deg,#14100c,#0a0806)", overflow: "hidden" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: "repeating-linear-gradient(0deg,#6b5a3e 0 1px,transparent 1px 38px),repeating-linear-gradient(90deg,#6b5a3e 0 1px,transparent 1px 64px)" }} />
      <style>{`.why-card{transition:box-shadow .2s,border-color .2s}.why-card:hover{border-color:${GOLD};box-shadow:0 0 18px rgba(212,175,55,.45),inset 0 2px 12px rgba(0,0,0,.6)}.why-grid{display:grid;grid-template-columns:1fr;gap:14px}@media(min-width:900px){.why-grid{grid-template-columns:repeat(3,1fr)}}`}</style>
      <div style={{ position: "relative" }}>
        <h2 id="why" style={{ fontFamily: SERIF, color: GOLD, textAlign: "center", letterSpacing: "0.08em", margin: "0 0 20px", display: "flex", gap: 12, alignItems: "center", justifyContent: "center", flexWrap: "wrap", textShadow: "0 1px 3px rgba(0,0,0,.8)" }}>
          <Ankh /><span>{t.whyTitle}</span><span aria-hidden="true">⚓</span>
        </h2>
        <div className="why-grid">
          {items.map((it, i) => (
            <article key={i} className="why-card" style={{ background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #3d352a", borderRadius: 4, padding: 18, boxShadow: "inset 0 2px 12px rgba(0,0,0,.6)" }}>
              <div aria-hidden="true" style={{ fontSize: 30 }}>{it.icon}</div>
              <h3 style={{ fontFamily: SERIF, color: GOLD, fontSize: 15, letterSpacing: "0.04em", margin: "8px 0", textShadow: "0 1px 2px rgba(0,0,0,.8)" }}>{it.title}</h3>
              <p style={{ margin: 0, color: "#f5e6c4", lineHeight: 1.55, fontSize: 15 }}>{it.text}</p>
              {it.link && <a href={it.link} target="_blank" rel="noopener noreferrer" style={{ color: GOLD, display: "inline-block", marginTop: 8, fontSize: 14 }}>LinkedIn</a>}
            </article>
          ))}
        </div>
        <p style={{ textAlign: "center", margin: "22px 0 0" }}>
          <button onClick={onCta} style={{ background: "linear-gradient(90deg,#b45309,#ca8a04)", color: "#000", border: "2px solid #713f12", borderRadius: 4, padding: "14px 28px", fontSize: 18, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 22px rgba(202,138,4,.55), 0 4px 10px rgba(0,0,0,.5)" }}>{t.whyCta}</button>
        </p>
      </div>
    </section>
  );
}
