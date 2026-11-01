"use client";
import { useState } from "react";
import FounderSeal from "./FounderSeal";
import type { Dict } from "../lib/i18n";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const link: React.CSSProperties = { display: "block", background: "linear-gradient(90deg,#b45309,#ca8a04)", color: "#000", border: "2px solid #713f12", borderRadius: 4, padding: "10px 14px", fontWeight: 700, textDecoration: "none", margin: "8px 0" };

export default function AymanContact({ t, rtl = false }: { t: Dict; rtl?: boolean }) {
  const [open, setOpen] = useState(false);
  const label = t.ayman;
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label={label} title={label} style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, border: 0, background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={{ width: 56, height: 56, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#ca8a04,#713f12)", border: "2px solid #eab308", boxShadow: "0 6px 20px rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#2a1a05" }}>⚓</span>
        <span style={{ fontSize: 11, color: "#f5e6c4", background: "#1a1611cc", border: "1px solid #3d352a", borderRadius: 3, padding: "1px 6px" }}>{label}</span>
      </button>
      {open && (
        <div dir={rtl ? "rtl" : "ltr"} role="dialog" aria-modal="true" aria-label={label} onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: 380, width: "100%", background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #57493a", borderRadius: 4, padding: 12, boxShadow: "0 20px 50px rgba(0,0,0,.8)" }}>
            <button onClick={() => setOpen(false)} aria-label={t.close} style={{ position: "absolute", top: 6, insetInlineEnd: 12, background: "none", border: 0, color: "#d6cbb5", fontSize: 24, cursor: "pointer" }}>×</button>
            <div style={{ background: "#d4c5a9", color: "#2a2520", border: "3px double #7a6540", padding: "20px 16px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center" }}><FounderSeal size={110} ticker={false} /></div>
              <h2 style={{ fontFamily: SERIF, margin: "12px 0 4px" }}>{label}</h2>
              <p style={{ margin: 0, fontWeight: 700 }}>{t.contactTitle}</p>
              <p style={{ margin: "2px 0 12px", fontSize: 13 }}>{t.contactLine}</p>
              <a style={link} href="https://web4.elmahrosa.org" target="_blank" rel="noopener noreferrer">web4.elmahrosa.org</a>
              <p dir="rtl" style={{ margin: 0, fontWeight: 700 }}>تواصل مع المؤسس</p>
              <p style={{ margin: "2px 0 12px", fontSize: 13 }}>Founder - Dig Site 022 Alexandria</p>
              <a style={link} href="https://ayman.elmahrosa.org" target="_blank" rel="noopener noreferrer">ayman.elmahrosa.org</a>
              <a style={link} href="mailto:ayman@elmahrosa.org">Email: ayman@elmahrosa.org</a>
              <a style={link} href="https://wa.me/201006167293" target="_blank" rel="noopener noreferrer">WhatsApp 01006167293</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
