"use client";
import Link from "next/link";
import PharaohStyles from "./PharaohStyles";
import PharaohMark from "./PharaohMark";
import LangMenu from "./LangMenu";
import MusicToggle from "./MusicToggle";
import SiteFooter from "./SiteFooter";
import { useLang } from "../lib/useLang";
import type { Dict, Lang } from "../lib/i18n";
import type { ReactNode } from "react";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const NAV = {
  en: { home: "Home", joined: "Who Joined", world: "World", about: "About" },
  ar: { home: "الرئيسية", joined: "مين دخل", world: "العالم", about: "عن النظام" },
  id: { home: "Beranda", joined: "Bergabung", world: "Dunia", about: "Tentang" },
} as const;

// Shared frame for the secondary pages: slim nav, stone-dark body, the common footer.
export default function PageShell({ children }: { children: (ctx: { lang: Lang; L: Dict; rtl: boolean }) => ReactNode }) {
  const { lang, setLang, L, rtl, fading } = useLang();
  const n = NAV[lang];
  const link: React.CSSProperties = { color: "#d9c48a", textDecoration: "none", fontSize: 14, letterSpacing: "0.06em" };
  return (
    <>
      <PharaohStyles />
      <nav style={{ background: "rgba(10,8,6,.94)", borderBottom: "1px solid #3d352a" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div dir="ltr" style={{ display: "flex", alignItems: "center", gap: 8 }}><LangMenu lang={lang} onChange={setLang} /><MusicToggle rtl={rtl} /></div>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <PharaohMark size={38} /><span style={{ fontFamily: SERIF, fontSize: 18, letterSpacing: "0.18em", color: "#f1e7cf" }}>TEOS</span>
          </Link>
          <span style={{ marginInlineStart: "auto", display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/" style={link}>{n.home}</Link>
            <Link href="/joined" style={link}>{n.joined}</Link>
            <Link href="/world" style={link}>{n.world}</Link>
            <Link href="/system" style={link}>{n.about}</Link>
          </span>
        </div>
      </nav>
      <main dir={rtl ? "rtl" : "ltr"} lang={lang} data-fading={fading ? "1" : undefined} style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px 40px", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
        {children({ lang, L, rtl })}
        <SiteFooter t={L} />
      </main>
    </>
  );
}
