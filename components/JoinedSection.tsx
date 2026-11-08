import Link from "next/link";
import { OTHERS, CREST, BADGE, SECTION_TITLE, VIEW_PROFILE, FOUNDER_TITLE } from "../lib/joined";
import CrestImage from "./CrestImage";
import type { Lang } from "../lib/i18n";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const GOLD = "#b8973f"; // muted matte gold

export function Shield({ size = 16 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" fill="#b8973f" stroke="#4a3a12" strokeWidth="1.5" />
      <path d="M8 12l3 3 5-6" fill="none" stroke="#1a1408" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function JoinedBadge({ lang }: { lang: Lang }) {
  return (
    <span dir={lang === "ar" ? "rtl" : "ltr"} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", border: `1px solid ${GOLD}`, borderRadius: 4, background: "rgba(184,151,63,.12)", color: "#d9c48a", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>
      <Shield size={13} />{BADGE[lang]}
    </span>
  );
}

const cardBase: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", textDecoration: "none", background: "#17130f", border: "1px solid #3d352a", borderRadius: 6, color: "#f1e7cf", boxSizing: "border-box" };
const linkBtn: React.CSSProperties = { marginTop: "auto", padding: "8px 16px", border: `1px solid ${GOLD}`, borderRadius: 4, color: "#d9c48a", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" };

// Home: Founder Family, one compact row of small cards. Each opens that member's profile, never a purchase.
export function FounderFamily({ lang }: { lang: Lang }) {
  const names = ["ayman", "elmahrosa", "ashraf", ...OTHERS];
  const plate: React.CSSProperties = { ...cardBase, padding: "10px 8px", width: 118, flex: "0 0 auto" };
  return (
    <section aria-labelledby="family" style={{ margin: "36px 0 28px" }}>
      <h2 id="family" dir="auto" style={{ fontFamily: SERIF, letterSpacing: "0.12em", color: "#f1e7cf", textAlign: "center", margin: "0 0 16px", fontWeight: 400 }}>{FOUNDER_TITLE[lang]}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        {names.map((n) => (
          <Link key={n} href={`/u/${n}`} style={plate}>
            <div dir="ltr" style={{ fontFamily: SERIF, fontSize: 12, letterSpacing: "0.04em", overflowWrap: "anywhere" }}>{n.toUpperCase()}.TEOS</div>
            <div style={{ fontSize: 11, color: "#d9c48a", marginTop: 6, fontWeight: 700 }}>{VIEW_PROFILE[lang]} →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// /joined: small equal cards, three per row. Joined names are never for sale, so there is no buy link here.
// Names without their own crest image show a plain gold initial plate; no seal ever carries another person's name.
export default function JoinedSection({ lang }: { lang: Lang }) {
  return (
    <section aria-labelledby="joined">
      <h1 id="joined" dir="auto" style={{ fontFamily: SERIF, letterSpacing: "0.12em", color: "#f1e7cf", textAlign: "center", margin: "0 0 22px", fontWeight: 400 }}>{SECTION_TITLE[lang].toUpperCase()}</h1>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }} className="joined-grid">
        {OTHERS.map((n) => (
          <Link key={n} href={`/u/${n}`} style={{ ...cardBase, padding: 14, minHeight: 230 }}>
            {CREST[n] ? (
              <CrestImage src={CREST[n]} alt={`${n.toUpperCase()}.TEOS`} maxWidth={110} marginTop={0} />
            ) : (
              <div aria-hidden="true" style={{ width: 110, height: 110, borderRadius: "50%", border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 48, color: "#d9c48a", background: "radial-gradient(circle at 35% 30%,#2a2316,#14110d)" }}>{n[0].toUpperCase()}</div>
            )}
            <div dir="ltr" style={{ fontFamily: SERIF, fontSize: 16, letterSpacing: "0.06em", margin: "12px 0 8px", overflowWrap: "anywhere" }}>{n.toUpperCase()}.TEOS</div>
            <div style={{ marginBottom: 12 }}><JoinedBadge lang={lang} /></div>
            <span style={linkBtn}>{VIEW_PROFILE[lang]} →</span>
          </Link>
        ))}
      </div>
      <style>{`@media(max-width:560px){.joined-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important}}`}</style>
    </section>
  );
}
