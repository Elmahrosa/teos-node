"use client";
import { useState } from "react";
import type { Dict } from "../lib/i18n";


export default function AymanContact({ t, rtl = false }: { t: Dict; rtl?: boolean }) {
  const [open, setOpen] = useState(false);
  const label = t.ayman;
  const item: React.CSSProperties = { display: "block", color: "#f5e6c4", textDecoration: "none", padding: "10px 4px", fontSize: 14, borderBottom: "1px solid #3d352a", background: "none", border: 0, textAlign: "start", width: "100%", cursor: "pointer" };
  return (
    <div className="ayman-anchor" style={{ position: "relative", height: 128, margin: "8px -20px -32px" }}>
    <div style={{ position: "absolute", left: 16, bottom: 80, zIndex: 50, width: 48, height: 48 }}>
      <button onClick={() => setOpen((o) => !o)} aria-label={label} title={label} aria-expanded={open} style={{ width: 48, height: 48, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#ca8a04,#713f12)", border: "2px solid #eab308", boxShadow: "0 4px 14px rgba(0,0,0,.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#2a1a05", padding: 0 }}>⚓</button>
      {open && (
        <div dir="ltr" role="menu" style={{ position: "absolute", left: 0, bottom: 56, width: 250, background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #57493a", borderRadius: 4, padding: "4px 12px", boxShadow: "0 12px 30px rgba(0,0,0,.8)" }}>
          <a role="menuitem" style={item} href="https://wa.me/201006167293" target="_blank" rel="noopener noreferrer">{rtl ? "واتساب" : "WhatsApp"}: 01006167293</a>
          <a role="menuitem" style={item} href="https://web4.elmahrosa.org" target="_blank" rel="noopener noreferrer">{rtl ? "الموقع" : "Website"}: web4.elmahrosa.org</a>
          <button role="menuitem" type="button" style={{ ...item, borderBottom: 0 }} onClick={() => setOpen(false)}>{rtl ? "اقفل القايمة" : "Close menu"}</button>
        </div>
      )}
    </div>
    </div>
  );
}
