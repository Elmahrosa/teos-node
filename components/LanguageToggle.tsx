"use client";
import { LANGS, type Lang } from "../lib/i18n";

const tablet: React.CSSProperties = { border: "1px solid #57493a", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 14, maxWidth: "100%", whiteSpace: "nowrap" };

export default function LanguageToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div role="group" aria-label="Language" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end", minWidth: 0 }}>
      {LANGS.map((l) => (
        <button key={l.code} type="button" lang={l.code} aria-pressed={lang === l.code} onClick={() => onChange(l.code)} style={{ ...tablet, background: lang === l.code ? "#713f12" : "#292321", color: lang === l.code ? "#fef3c7" : "#d6cbb5" }}>{l.label}</button>
      ))}
    </div>
  );
}
