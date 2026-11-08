import { JOINED, CREST, BADGE, SECTION_TITLE, VIEW_PROFILE } from "../lib/joined";
import CrestImage from "./CrestImage";
import type { Lang } from "../lib/i18n";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";

export function Shield({ size = 16 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" fill="#eab308" stroke="#713f12" strokeWidth="1.5" />
      <path d="M8 12l3 3 5-6" fill="none" stroke="#451a03" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function JoinedBadge({ lang }: { lang: Lang }) {
  return (
    <span dir={lang === "ar" ? "rtl" : "ltr"} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", border: "1px solid #ca8a04", borderRadius: 4, background: "rgba(202,138,4,.15)", color: "#fbbf24", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
      <Shield size={14} />{BADGE[lang]}
    </span>
  );
}

// Cards link to the profile, never to a purchase.
export default function JoinedSection({ lang }: { lang: Lang }) {
  return (
    <section aria-labelledby="joined" style={{ margin: "24px 0" }}>
      <h2 id="joined" dir="auto" style={{ fontFamily: SERIF, letterSpacing: "0.1em", color: "#fef3c7", textAlign: "center", margin: "0 0 14px" }}>{SECTION_TITLE[lang]}</h2>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        {JOINED.map((n) => (
          <a key={n} href={`/u/${n}`} style={{ display: "block", textDecoration: "none", textAlign: "center", padding: 14, background: "#2a2520", border: "1px solid #57493a", borderRadius: 8, color: "#fef3c7" }}>
            <CrestImage src={CREST[n] ?? "/genesis-seal.png"} alt={`${n.toUpperCase()}.TEOS`} maxWidth={160} marginTop={0} />
            <div dir="ltr" style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, margin: "10px 0 8px", overflowWrap: "anywhere" }}>{n.toUpperCase()}.TEOS</div>
            <JoinedBadge lang={lang} />
            <div style={{ marginTop: 10, color: "#fbbf24", fontSize: 14, fontWeight: 700 }}>{VIEW_PROFILE[lang]} →</div>
          </a>
        ))}
      </div>
    </section>
  );
}
