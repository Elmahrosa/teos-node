"use client";
import { useState } from "react";
import type { Dict } from "../lib/i18n";
import { SOCIAL } from "../lib/social";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const card = (c: string): React.CSSProperties => ({ background: "#1a1611", border: `1px solid ${c}`, borderRadius: 6, padding: 14, display: "flex", flexDirection: "column", gap: 8 });
const box: React.CSSProperties = { background: "#000", borderRadius: 4, padding: "10px 8px", textAlign: "center" };
const btn = (bg: string): React.CSSProperties => ({ display: "block", background: bg, color: "#fff", textAlign: "center", padding: "10px 8px", borderRadius: 4, fontWeight: 700, fontSize: 14, textDecoration: "none", border: 0, cursor: "pointer", width: "100%", boxSizing: "border-box" });

function Copy({ text, t }: { text: string; t: Dict }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }).catch(() => {}); }} style={{ ...btn("#3d352a"), padding: "6px 8px", fontSize: 12, fontWeight: 400 }}>
      {ok ? t.payCopied : t.payCopy}
    </button>
  );
}

// Three ways to pay. The Vodafone Cash and PayPal numbers are public, taken from lib/social.ts.
export default function PaymentOptions({ t, rtl }: { t: Dict; rtl: boolean }) {
  const wa = (msg: string) => `https://wa.me/${SOCIAL.vodafone.replace(/^0/, "20")}?text=${encodeURIComponent(msg)}`;
  return (
    <section id="payment" dir={rtl ? "rtl" : "ltr"} style={{ background: "#0a0806", border: "2px solid #ca8a04", borderRadius: 8, padding: 16, margin: "24px 0" }}>
      <h3 style={{ fontFamily: SERIF, color: "#eab308", textAlign: "center", fontSize: 20, margin: "0 0 14px" }}>{t.payTitle}</h3>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
        <div style={card("#7c3aed")}>
          <h4 style={{ margin: 0, color: "#a78bfa" }}>{t.pay1T}</h4>
          <p style={{ margin: 0, fontSize: 13, color: "#f5e6c4" }}>{t.pay1D}</p>
          <p style={{ margin: "auto 0 0", fontSize: 13, color: "#4ade80" }}>{t.pay1Cta}</p>
        </div>
        <div style={card("#dc2626")}>
          <h4 style={{ margin: 0, color: "#f87171" }}>{t.pay2T}</h4>
          <p style={{ margin: 0, fontSize: 13, color: "#f5e6c4" }}>{t.pay2D}</p>
          <div style={box}>
            <div dir="ltr" style={{ color: "#4ade80", fontFamily: "ui-monospace, monospace", fontWeight: 800, fontSize: 22 }}>{SOCIAL.vodafone}</div>
            <div style={{ color: "#fde047", fontSize: 12 }}>{t.pay2Lbl}</div>
          </div>
          <Copy text={SOCIAL.vodafone} t={t} />
          <a style={btn("#16a34a")} href={wa(t.pay2Msg)} target="_blank" rel="noopener noreferrer">{t.pay2Wa}</a>
        </div>
        <div style={card("#2563eb")}>
          <h4 style={{ margin: 0, color: "#60a5fa" }}>{t.pay3T}</h4>
          <p style={{ margin: 0, fontSize: 13, color: "#f5e6c4" }}>{t.pay3D}</p>
          <div style={box}><div dir="ltr" style={{ color: "#93c5fd", fontFamily: "ui-monospace, monospace", fontWeight: 700, fontSize: 15, wordBreak: "break-all" }}>{SOCIAL.paypal}</div></div>
          <Copy text={SOCIAL.paypal} t={t} />
          <a style={btn("#3f3f46")} href={wa(t.pay3Msg)} target="_blank" rel="noopener noreferrer">{t.pay3Wa}</a>
        </div>
      </div>
      <p style={{ color: "#fde68a", fontSize: 13, textAlign: "center", margin: "14px 0 0" }}>{t.payAfter}</p>
    </section>
  );
}
