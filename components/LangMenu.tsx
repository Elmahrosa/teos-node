"use client";
import { useEffect, useRef, useState } from "react";
import { LANGS, type Lang } from "../lib/i18n";

export const CTRL: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 34, boxSizing: "border-box", border: "1px solid #57493a", borderRadius: 4, background: "#292321", color: "#d6cbb5", cursor: "pointer", padding: 0 };

// One globe button; click opens a small list of languages.
export default function LangMenu({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  return (
    <div ref={box} dir="ltr" style={{ position: "relative" }}>
      <button type="button" aria-label="Language" title="Language" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} style={CTRL}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></svg>
      </button>
      {open && (
        <div role="menu" style={{ position: "absolute", top: 40, left: 0, zIndex: 80, minWidth: 160, background: "#1a1611", border: "1px solid #57493a", borderRadius: 4, boxShadow: "0 12px 30px rgba(0,0,0,.8)", padding: 4 }}>
          {LANGS.map((l) => (
            <button key={l.code} role="menuitemradio" aria-checked={lang === l.code} lang={l.code} type="button" onClick={() => { onChange(l.code); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "start", padding: "8px 12px", border: 0, borderRadius: 3, cursor: "pointer", fontSize: 14, background: lang === l.code ? "#713f12" : "transparent", color: lang === l.code ? "#fef3c7" : "#d6cbb5" }}>{l.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
