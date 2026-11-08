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
export default function HeroVideo({ searchLabel, connectLabel, onSearch, onConnect, rtl, children }: { searchLabel: string; connectLabel: string; onSearch: () => void; onConnect: () => void; rtl: boolean; children?: React.ReactNode }) {
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
        <p dir="ltr" style={{ margin: "0 0 14px", fontFamily: SERIF, fontSize: "clamp(12px,2.2vw,16px)", color: "#d9c48a", letterSpacing: "0.3em" }}>EL MAHROSA TEOS</p>
        <h1 dir="ltr" style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(38px,8vw,78px)", lineHeight: 1.05, color: "#fef3c7", letterSpacing: "0.04em", margin: "0 0 12px", textShadow: "0 2px 10px rgba(0,0,0,.9)" }}>Partners, Not Rent</h1>
        <h2 dir="ltr" style={{ margin: 0, fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(18px,3.6vw,32px)", color: "#e0b84a", letterSpacing: "0.08em", textShadow: "0 2px 8px rgba(0,0,0,.9)" }}>Own Your Domain Forever</h2>
        {children}
      </div>
    </section>
  );
}
