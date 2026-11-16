"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageToggle from "./LanguageToggle";
import { useLang } from "../lib/useLang";
import type { Lang } from "../lib/i18n";

// Shared navigation for the app surfaces that are chrome around user content: the TEOS browser,
// the site builder and the wallet. A published site (/s) only gets the slim pill, so the owner's
// design is not wrapped in our menu.

type Labels = { home: string; browser: string; wallet: string };

const LABELS: Record<Lang, Labels> = {
  en: { home: "Home", browser: "Browser", wallet: "My names" },
  ar: { home: "الرئيسية", browser: "المتصفح", wallet: "أسمائي" },
  id: { home: "Beranda", browser: "Peramban", wallet: "Nama saya" },
};

const bar: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 60,
  display: "flex",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  padding: "10px 18px",
  background: "rgba(10,8,6,0.92)",
  borderBottom: "1px solid rgba(180,130,30,0.45)",
  backdropFilter: "blur(10px)",
};

const brand: React.CSSProperties = {
  color: "#facc15",
  fontFamily: "Cinzel, Georgia, serif",
  fontWeight: 700,
  letterSpacing: 3,
  textDecoration: "none",
  fontSize: 20,
};

const linkBase: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 999,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: "nowrap",
};

function FullNav() {
  const { lang, setLang, rtl } = useLang();
  const labels = LABELS[lang] ?? LABELS.en;
  const path = usePathname() || "/";
  const items = [
    { href: "/", label: labels.home, active: path === "/" },
    { href: "/browser", label: labels.browser, active: path.startsWith("/browser") },
    { href: "/wallet", label: labels.wallet, active: path.startsWith("/wallet") },
  ];
  return (
    <nav dir={rtl ? "rtl" : "ltr"} aria-label="TEOS" style={bar}>
      <Link href="/" style={brand} aria-label="TEOS home">TEOS</Link>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            style={{ ...linkBase, color: item.active ? "#1a1206" : "#e8dcc2", background: item.active ? "#facc15" : "transparent" }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <LanguageToggle lang={lang} onChange={setLang} />
    </nav>
  );
}

export default function TeosNav({ variant = "full" }: { variant?: "full" | "slim" }) {
  if (variant === "slim") {
    return (
      <Link
        href="/"
        aria-label="TEOS home"
        title="TEOS"
        style={{
          position: "fixed",
          insetInlineStart: 12,
          bottom: 12,
          zIndex: 60,
          padding: "6px 12px",
          borderRadius: 999,
          background: "rgba(10,8,6,0.78)",
          border: "1px solid rgba(180,130,30,0.5)",
          color: "#facc15",
          fontFamily: "Cinzel, Georgia, serif",
          fontWeight: 700,
          letterSpacing: 2,
          fontSize: 12,
          textDecoration: "none",
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
        }}
      >
        TEOS
      </Link>
    );
  }
  return <FullNav />;
}
