"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type T = { tld: string; label: string; name?: string; flag: string };
const Flag = ({ t, size = 22 }: { t: T; size?: number }) =>
  t.tld.length === 2 ? (
    <img src={`https://flagcdn.com/w80/${t.tld}.png`} alt="" width={size} height={size} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
  ) : (
    <span style={{ width: size, textAlign: "center" }}>{t.flag}</span>
  );

// Vertical country picker, same look as the language tablets. The list is only rendered while open.
export default function CountryDropdown({ tlds, selected, onSelect, placeholder = "Search country..." }: { tlds: T[]; selected: string; onSelect: (tld: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const cur = tlds.find((t) => t.tld === selected);
  const rows = useMemo(() => {
    if (!open) return [];
    const s = q.trim().toLowerCase().replace(/^\./, "");
    return tlds.filter((t) => t.tld !== "teos" && (!s || t.tld.includes(s) || (t.name ?? t.label).toLowerCase().includes(s)));
  }, [open, q, tlds]);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)} style={{ background: "#292321", color: "#d6cbb5", border: "1px solid #57493a", borderRadius: 4, padding: "8px 14px", cursor: "pointer", fontSize: 15, display: "inline-flex", alignItems: "center", gap: 8 }}>
        {cur ? <Flag t={cur} /> : null}<b>{selected.toUpperCase()}</b><span style={{ fontSize: 11 }}>▾</span>
      </button>
      {open && (
        <div role="listbox" style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", zIndex: 50, width: 280, background: "#1a1611", border: "1px solid #57493a", borderRadius: 4, boxShadow: "0 12px 30px rgba(0,0,0,.7)", display: "flex", flexDirection: "column", textAlign: "start" }}>
          <input autoFocus dir="auto" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} style={{ background: "#c9b896", color: "#2a2520", border: 0, borderBottom: "1px solid #8a7550", padding: "10px 12px", fontSize: 15, outline: "none" }} />
          <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {rows.map((t) => (
              <button key={t.tld} type="button" role="option" aria-selected={t.tld === selected} onClick={() => { onSelect(t.tld); setOpen(false); setQ(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: t.tld === selected ? "#713f12" : "transparent", color: "#f5e6c4", border: 0, borderBottom: "1px solid #2a2520", cursor: "pointer", fontSize: 14, textAlign: "start" }}>
                <Flag t={t} /><span style={{ flex: 1 }}>{t.name ?? t.label}</span><span style={{ color: "#a89a80", fontFamily: "ui-monospace, monospace" }}>.{t.tld}</span>
              </button>
            ))}
            {rows.length === 0 && <div style={{ padding: 12, color: "#a89a80", fontSize: 13 }}>-</div>}
          </div>
        </div>
      )}
    </div>
  );
}
