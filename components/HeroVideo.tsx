"use client";
import { useEffect, useState } from "react";
import type { TFn } from "@/lib/locales";

const VIDEO = "/videos/teos-architecture.mp4.mp4";
const POSTER = "/videos/teos-architecture-poster.jpg";
const SERIF = "Cinzel, Georgia, serif";

// Hero: architecture video behind a 60% black layer. Data Saver or reduced motion get the poster only.
// Phones now play the same 2 MB muted, inline video. The video file already ends with 2 s of the gold coin frame held,
// so plain `loop` shows it for 2 s before it restarts.
// First screen: three plain-language actions only. Technical details live below the fold on the homepage.
export default function HeroVideo({ t, lang, rtl, onBook, onOwn, demoAvailable }: { t: TFn; lang: string; rtl: boolean; onBook: () => void; onOwn: () => void; demoAvailable: boolean }) {
  const [playVideo, setPlayVideo] = useState(false);
  useEffect(() => {
    const saveData = (navigator as any).connection?.saveData === true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = () => setPlayVideo(!saveData && !reduce);
    update();
  }, []);

  const btn: React.CSSProperties = { background: "linear-gradient(90deg,#b45309,#ca8a04)", color: "#000", border: "2px solid #713f12", borderRadius: 4, padding: "12px 26px", fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,.5)" };
  const ghost: React.CSSProperties = { ...btn, background: "rgba(10,8,6,.55)", color: "#fef3c7", border: "2px solid #ca8a04" };
  const off: React.CSSProperties = { ...ghost, cursor: "not-allowed", opacity: 0.55 };
  const dir = rtl ? "rtl" : "ltr";
  // Cinzel is a Latin-only face, so the Arabic title uses the Cairo face already loaded by the root layout.
  const titleFont = lang === "ar" ? "var(--font-cairo), Cairo, sans-serif" : SERIF;

  return (
    <section aria-label="TEOS" style={{ position: "relative", width: "100%", margin: 0, overflow: "hidden", background: `#0a0806 url(${POSTER}) center/cover no-repeat`, minHeight: "clamp(420px, 62vh, 620px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {playVideo && (
        <video autoPlay muted loop playsInline preload="auto" poster={POSTER} aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, inset: 0, width: "100%", height: "100%", minWidth: "100%", minHeight: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}>
          <source src={VIDEO} type="video/mp4" />
        </video>
      )}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)" }} />
      <div dir={dir} style={{ position: "relative", textAlign: "center", padding: "56px 20px", maxWidth: 860 }}>
        <h1 dir={dir} lang={lang} style={{ fontFamily: titleFont, fontSize: "clamp(26px,4.6vw,46px)", color: "#fef3c7", letterSpacing: "0.04em", margin: "0 0 12px", textShadow: "0 2px 10px rgba(0,0,0,.9)" }}>{t("home.title")}</h1>
        <p dir={dir} lang={lang} style={{ margin: 0, fontFamily: SERIF, fontSize: "clamp(18px,3vw,26px)", color: "#fbbf24", fontWeight: 700 }}>{t("home.subtitle")}</p>
        <p dir={dir} lang={lang} style={{ margin: "14px auto 0", maxWidth: 620, fontSize: "clamp(15px,2.2vw,18px)", color: "#d6cbb5", lineHeight: 1.7 }}>{t("home.description")}</p>
        <p dir={dir} lang={lang} style={{ margin: "10px 0 0", fontSize: 15, color: "#a89a80" }}>{t("home.note")}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 26 }}>
          <button style={btn} onClick={onBook}>{t("home.ctaBook")}</button>
          <button style={ghost} onClick={onOwn}>{t("home.ctaOwn")}</button>
          <button style={demoAvailable ? ghost : off} disabled={!demoAvailable} aria-disabled={!demoAvailable} title={demoAvailable ? undefined : t("home.demoUnavailable")}>{t("home.ctaDemo")}</button>
        </div>
        <p dir={dir} lang={lang} style={{ margin: "22px auto 0", maxWidth: 640, fontSize: 12, color: "#a89a80", lineHeight: 1.7 }}>{t("home.disclaimer")}</p>
      </div>
    </section>
  );
}
