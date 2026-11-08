"use client";
import LangMenu, { CTRL } from "./LangMenu";
import MusicToggle from "./MusicToggle";
import { useMusic } from "./MusicProvider";
import type { Lang } from "../lib/i18n";

const TXT = {
  en: { connect: "Connect Wallet", wallet: "Phantom, Solflare, Backpack, Trust, Coin98, Coinbase, Nightly, TokenPocket, Bitget", on: "Music ON - keeps playing", off: "Music OFF", lang: "EN / AR" },
  ar: { connect: "ربط المحفظة", wallet: "Phantom, Solflare, Backpack, Trust, Coin98, Coinbase, Nightly, TokenPocket, Bitget", on: "الموسيقى تعمل - تستمر بين الصفحات", off: "الموسيقى متوقفة", lang: "EN / AR" },
  id: { connect: "Hubungkan Dompet", wallet: "Phantom, Solflare, Backpack, Trust, Coin98, Coinbase, Nightly, TokenPocket, Bitget", on: "Musik ON - terus berputar", off: "Musik OFF", lang: "EN / AR" },
} as const;

// Three icons in one aligned row: wallet, sound, language. Equal-width cells so the icons line up.
export default function TopIcons({ lang, setLang, rtl, onWallet }: { lang: Lang; setLang: (l: Lang) => void; rtl: boolean; onWallet: () => void }) {
  const { on } = useMusic();
  const t = TXT[lang];
  const cell: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, textAlign: "start", color: "#d6cbb5", fontSize: 13, lineHeight: 1.35 };
  return (
    <div dir={rtl ? "rtl" : "ltr"} className="top-icons" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, alignItems: "center", maxWidth: 860, margin: "26px auto 0", width: "100%" }}>
      <div style={cell}><LangMenu lang={lang} onChange={setLang} /><span>{t.lang}</span></div>
      <div style={cell}><MusicToggle rtl={rtl} /><span>{on ? t.on : t.off}</span></div>
      <div style={cell}>
        <button type="button" onClick={onWallet} aria-label="Wallets" title="Wallets" style={CTRL}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 012-2h13v4" /><path d="M3 7v11a2 2 0 002 2h15a1 1 0 001-1v-9a1 1 0 00-1-1H5a2 2 0 01-2-2z" /><circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" /></svg>
        </button>
        <span><strong style={{ color: "#fef3c7", display: "block" }}>{t.connect}</strong><span style={{ fontSize: 11 }}>{t.wallet}</span></span>
      </div>
      <style>{`@media(max-width:640px){.top-icons{grid-template-columns:1fr !important;max-width:340px !important}}`}</style>
    </div>
  );
}
