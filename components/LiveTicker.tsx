"use client";
import { useEffect, useState } from "react";
import type { Dict } from "../lib/i18n";

// Top bar: a fixed label on the left and ONE message at a time on the right, fading between messages.
// No scrolling text, so nothing can overlap. Items come from real data (founders minted, total sold, TLD count).
export default function LiveTicker({ t, rtl, founders, sold, tlds }: { t: Dict; rtl: boolean; founders: string[]; sold: number | null; tlds: number }) {
  const lead = t.ticker.split("•").map((s) => s.trim()).filter((s) => s && s !== t.liveLabel && !/^LIVE FROM/i.test(s));
  const items = [
    ...lead,
    ...founders.map((f) => `${f} ${t.tkMinted}`),
    ...(sold && sold > 0 ? [`${sold} ${t.tkSold}`] : []),
    t.tkGenesis,
    t.tkEarly,
    ...(tlds ? [`${tlds} ${t.tkTlds}`] : []),
    t.tkRoot,
    t.tkRule,
  ].filter(Boolean);

  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => { setI((n) => n + 1); setShow(true); }, 350);
    }, 5500);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="lt-bar" style={{ display: "flex", width: "100%", overflow: "hidden", background: "#14110d", borderBottom: "1px solid #3d352a", color: "#d9c48a", alignItems: "center", height: 36 }}>
      <div style={{ background: "#15803d", color: "#fff", padding: "0 14px", height: "100%", display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0, whiteSpace: "nowrap" }}>
        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
        <span>LIVE - ALEX</span>
      </div>
      <div aria-live="off" style={{ flex: 1, minWidth: 0, padding: "0 14px", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: show ? 1 : 0, transition: "opacity .35s ease" }}>
        {items[i % items.length]}
      </div>
      <style>{`@media(max-width:600px){.lt-bar{height:32px !important}.lt-bar>div:first-child{padding:0 8px !important;font-size:10px !important}}`}</style>
    </div>
  );
}
