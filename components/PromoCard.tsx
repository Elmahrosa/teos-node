"use client";
import { useEffect, useState } from "react";
import { SOCIAL } from "../lib/social";

// 72-hour Old Pioneers offer. Claimed by hand (proof sent to the founder, who mints manually), not through the site's checkout.
const ENDS = Date.parse("2026-11-12T21:00:00Z");

export default function PromoCard() {
  const [phase, setPhase] = useState<"off" | "in" | "out">("off");
  useEffect(() => {
    if (Date.now() >= ENDS) return;
    setPhase("in");
    const a = setTimeout(() => setPhase("out"), 10000);
    const b = setTimeout(() => setPhase("off"), 10900);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (phase === "off") return null;
  const row: React.CSSProperties = { margin: "2px 0", fontFamily: "ui-monospace, monospace", fontSize: 13 };
  return (
    <div role="dialog" aria-label="Old Pioneers offer" dir="ltr" style={{ position: "fixed", bottom: 20, left: "50%", transform: `translateX(-50%) translateY(${phase === "out" ? 220 : 0}px)`, opacity: phase === "out" ? 0 : 1, transition: "all .8s ease", zIndex: 9999, width: "min(92vw, 440px)", boxSizing: "border-box", background: "#0A1128", color: "#fff", border: "2px solid gold", padding: "14px 18px", borderRadius: 15, textAlign: "center", boxShadow: "0 0 20px #000", fontSize: 14, lineHeight: 1.45 }}>
      <button type="button" aria-label="Close" onClick={() => setPhase("off")} style={{ position: "absolute", top: 6, right: 10, background: "none", border: 0, color: "#d9c48a", fontSize: 18, cursor: "pointer" }}>×</button>
      <div style={{ color: "gold", fontWeight: 700 }}>For 72h only - TEOS Network</div>
      <div style={{ fontWeight: 700, margin: "4px 0" }}>70% OFF - Old Pioneers Only</div>
      <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>You were there before the gate opened. Now it pays to stay.</div>
      <div style={row}>xxx.teos | $30 → $9</div>
      <div style={row}>xxx.eg | $60 → $18</div>
      <div style={row}>Both | $90 → $27</div>
      <div style={{ fontSize: 12, margin: "8px 0 4px" }}>Search your name, screenshot AVAILABLE, and send proof you received TEOS tokens from me before. I mint it by hand to your wallet. No proof, no discount.</div>
      <a href={SOCIAL.telegram} target="_blank" rel="noopener noreferrer" style={{ color: "gold", fontWeight: 700 }}>Send proof on Telegram</a>
    </div>
  );
}
