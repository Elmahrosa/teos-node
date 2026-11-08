"use client";
import { useEffect, useState } from "react";
import OptImg from "./OptImg";

const VIDEO = "/videos/teos-architecture.mp4.mp4";
const VIDEO_NEW = "/videos/hero-bg.mp4";
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
          <source src={VIDEO_NEW} type="video/mp4" />
          <source src={VIDEO} type="video/mp4" />
        </video>
      )}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)" }} />
      <div dir={rtl ? "rtl" : "ltr"} style={{ position: "relative", textAlign: "center", padding: "56px 20px", maxWidth: 900 }}>
        <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 700, color: "#fef3c7", textShadow: "0 2px 10px rgba(0,0,0,.9)" }}>
          <span dir="rtl" lang="ar" style={{ display: "block", fontFamily: "var(--font-cairo), Cairo, sans-serif", fontSize: "clamp(26px,5.4vw,52px)", lineHeight: 1.3 }}>تملك دومينك إلى الأبد - هويتك السيادية</span>
          <span dir="ltr" lang="en" style={{ display: "block", marginTop: 10, fontSize: "clamp(18px,3.4vw,32px)", lineHeight: 1.25, color: "#e0b84a", letterSpacing: "0.04em" }}>Own Your Domain Forever - Your Sovereign Identity</span>
        </h1>
        {children}
        <OptImg src="/images/hero-lighthouse.jpg" alt="Golden lighthouse with six doors: .QA .KW .SA .BH .AE .OM" style={{ display: "block", margin: "26px auto 0", maxWidth: "min(100%, 760px)", maxHeight: 320, width: "auto", height: "auto", borderRadius: 6, border: "1px solid #8a7335" }} />
      </div>
    </section>
  );
}
