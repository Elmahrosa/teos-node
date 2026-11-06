"use client";
import { useEffect, useState } from "react";
import ALL_TLDS from "@/tlds/all.json";

// Static count (not the async stats), so the badge is 127 / 127 from the first paint.
const NATIONS = (ALL_TLDS as unknown[]).length;
const VIDEO = "/videos/teos-architecture.mp4.mp4";
const POSTER = "/videos/teos-architecture-poster.jpg";
const SERIF = "Cinzel, Georgia, serif";

// Hero: architecture video behind a 60% black layer. Data Saver or reduced motion get the poster only.
// Phones now play the same 2 MB muted, inline video. The video file already ends with 2 s of the gold coin frame held,
// so plain `loop` shows it for 2 s before it restarts.
export default function HeroVideo({ searchLabel, connectLabel, onSearch, onConnect, rtl }: { searchLabel: string; connectLabel: string; onSearch: () => void; onConnect: () => void; rtl: boolean }) {
  const [playVideo, setPlayVideo] = useState(false);
  useEffect(() => {
    const saveData = (navigator as any).connection?.saveData === true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = () => setPlayVideo(!saveData && !reduce);
    update();
  }, []);

  const btn: React.CSSProperties = { background: "linear-gradient(90deg,#b45309,#ca8a04)", color: "#000", border: "2px solid #713f12", borderRadius: 4, padding: "12px 26px", fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,.5)" };
  const ghost: React.CSSProperties = { ...btn, background: "rgba(10,8,6,.55)", color: "#fef3c7", border: "2px solid #ca8a04" };

  return (
    <section aria-label="EL MAHROSA TEOS" style={{ position: "relative", width: "100%", margin: 0, overflow: "hidden", background: `#0a0806 url(${POSTER}) center/cover no-repeat`, minHeight: "clamp(420px, 62vh, 620px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {playVideo && (
        <video autoPlay muted loop playsInline preload="auto" poster={POSTER} aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, inset: 0, width: "100%", height: "100%", minWidth: "100%", minHeight: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}>
          <source src={VIDEO} type="video/mp4" />
        </video>
      )}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)" }} />
      <div dir="ltr" style={{ position: "absolute", top: 14, right: 14, padding: "6px 12px", border: "1px solid #ca8a04", background: "rgba(10,8,6,.7)", color: "#fbbf24", fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.08em" }}>
        {NATIONS} / {NATIONS} NATIONS SYNCHRONIZED
      </div>
      <div dir={rtl ? "rtl" : "ltr"} style={{ position: "relative", textAlign: "center", padding: "56px 20px", maxWidth: 900 }}>
        <h1 dir="ltr" style={{ fontFamily: SERIF, fontSize: "clamp(32px,7vw,64px)", color: "#fef3c7", letterSpacing: "0.1em", margin: "0 0 10px", textShadow: "0 2px 10px rgba(0,0,0,.9)" }}>EL MAHROSA TEOS</h1>
        <p dir="ltr" style={{ margin: 0, fontFamily: SERIF, fontSize: "clamp(15px,3vw,24px)", color: "#fbbf24", letterSpacing: "0.22em", fontWeight: 700 }}>SOVEREIGN SYSTEM ARCHITECTURE</p>
        <p dir="rtl" lang="ar" style={{ margin: "12px 0 0", fontSize: "clamp(16px,2.8vw,22px)", color: "#d6cbb5" }}>نظام النطاقات السيادية</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 26 }}>
          <button style={btn} onClick={onSearch}>{searchLabel}</button>
          <button className="hero-connect" style={ghost} onClick={onConnect}>{connectLabel}</button>
        </div>
      </div>
    </section>
  );
}
