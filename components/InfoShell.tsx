"use client";
import type { ReactNode } from "react";
import LanguageToggle from "./LanguageToggle";
import { useLang } from "../lib/useLang";
import type { Dict, Lang } from "../lib/i18n";

// Shared frame for the small pages (terms, privacy, success): stone card, language toggle, back link.
export default function InfoShell({ children }: { children: (t: Dict, lang: Lang) => ReactNode }) {
  const { lang, setLang, L, rtl } = useLang();
  return (
    <main dir={rtl ? "rtl" : "ltr"} style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <LanguageToggle lang={lang} onChange={setLang} />
      <div style={{ background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #3d352a", borderRadius: 4, padding: 24, margin: "20px 0", boxShadow: "inset 0 2px 12px rgba(0,0,0,.6)", lineHeight: 1.6 }}>
        {children(L, lang)}
      </div>
      <a href="/" style={{ color: "#eab308" }}>← {L.back}</a>
    </main>
  );
}
