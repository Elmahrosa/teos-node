"use client";
import type { Dict } from "../lib/i18n";

// Top bar: fixed green "live" label on the left, red marquee on the right.
// Items come from real data: founder names minted, total sold (when the API reports it), TLD count.
export default function LiveTicker({ t, rtl, founders, sold, tlds }: { t: Dict; rtl: boolean; founders: string[]; sold: number | null; tlds: number }) {
  const items = [
    ...founders.map((f) => `${f} ${t.tkMinted}`),
    ...(sold && sold > 0 ? [`${sold} ${t.tkSold}`] : []),
    t.tkGenesis,
    t.tkEarly,
    ...(tlds ? [`${tlds} ${t.tkTlds}`] : []),
    t.tkRoot,
    t.tkRule,
  ];
  // The green label already says "LIVE FROM ALEXANDRIA"; drop that leading phrase from the scrolling text so the two never collide.
  const lead = t.ticker.includes("•") ? t.ticker.slice(t.ticker.indexOf("•") + 1).trim() + " " : t.ticker;
  const line = lead + items.join("  •  ") + "  •  ";
  // The track holds the line twice and moves by half its width, so the loop has no jump.
  return (
    <div dir={rtl ? "rtl" : "ltr"} className="lt-bar" style={{ display: "flex", width: "100%", overflow: "hidden", background: "#dc2626", color: "#fff", alignItems: "center" }}>
      <div style={{ background: "#10B981", color: "#fff", padding: "0 14px", height: "100%", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0, zIndex: 2, whiteSpace: "nowrap" }}>
        <span className="lt-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
        <span className="lt-full">{t.liveLabel}</span>
        <span className="lt-short">{t.liveShort}</span>
      </div>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div className="lt-track" dir={rtl ? "rtl" : "ltr"} style={{ fontSize: 13, fontWeight: 600 }}>
          <span className="lt-group">{line.repeat(2)}</span>
          <span className="lt-group" aria-hidden>{line.repeat(2)}</span>
        </div>
      </div>
      <style>{`
        .lt-bar{height:36px}
        .lt-short{display:none}
        .lt-dot{animation:lt-pulse 1.4s ease-in-out infinite}
        .lt-track{display:flex;width:max-content;white-space:nowrap;will-change:transform;animation:lt-marquee 170s linear infinite}
        .lt-track[dir="rtl"]{animation-name:lt-marquee-rtl}
        .lt-group{flex-shrink:0;white-space:nowrap;padding-inline:1.5rem 3rem;line-height:36px}
        @media(max-width:600px){.lt-group{line-height:32px}}
        .lt-bar:hover .lt-track{animation-play-state:paused}
        @keyframes lt-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes lt-marquee-rtl{from{transform:translateX(0)}to{transform:translateX(50%)}}
        @keyframes lt-pulse{0%,100%{opacity:1}50%{opacity:.25}}
        @media(max-width:600px){.lt-bar{height:32px}.lt-bar>div:first-child{padding:0 8px !important;font-size:10px !important;gap:5px !important}}
        @media(prefers-reduced-motion:reduce){.lt-track{animation:none}.lt-dot{animation:none}}
      `}</style>
    </div>
  );
}
