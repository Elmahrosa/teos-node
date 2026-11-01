"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import FounderSeal from "./FounderSeal";
import { fmt, type Dict } from "../lib/i18n";

type TldInfo = { tld: string; label: string; name?: string; region?: string; flag: string; live: boolean; promo_usd: number };
type Row = { tld: string; available: boolean; reason: string | null; price_usd: number; is_promo: boolean };

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, monospace";
const gold: React.CSSProperties = { background: "linear-gradient(90deg,#b45309,#ca8a04)", color: "#000", border: "2px solid #713f12", borderRadius: 4, padding: "10px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,.5)" };
const greyBtn: React.CSSProperties = { background: "#3d352a", color: "#8a7d66", border: "2px solid #4a4032", borderRadius: 4, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "not-allowed" };

const Flag = ({ t, size = 28 }: { t: TldInfo; size?: number }) =>
  t.tld.length === 2 ? (
    <img src={`https://flagcdn.com/w80/${t.tld}.png`} alt={t.name ?? t.tld} width={size} height={size} style={{ borderRadius: "50%", objectFit: "cover", border: "1px solid #4a4032", flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
  ) : (
    <span style={{ width: size, height: size, borderRadius: "50%", background: "#3a3128", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{t.flag}</span>
  );

// Visitor's country: time zone first (closest to physical location), then the country part of the browser locale.
const TZ: Record<string, string> = { "Africa/Cairo": "eg", "Asia/Riyadh": "sa", "Asia/Dubai": "ae", "Asia/Qatar": "qa", "Africa/Casablanca": "ma", "Asia/Amman": "jo", "Asia/Kuwait": "kw", "Asia/Bahrain": "bh", "Asia/Muscat": "om", "Asia/Baghdad": "iq", "Asia/Beirut": "lb", "Africa/Tunis": "tn", "Africa/Algiers": "dz", "Africa/Tripoli": "ly", "Africa/Khartoum": "sd", "Asia/Jakarta": "id", "Europe/Istanbul": "tr", "Europe/London": "gb" };
export const localeCountry = () => {
  if (typeof navigator === "undefined") return "";
  try { const z = TZ[Intl.DateTimeFormat().resolvedOptions().timeZone]; if (z) return z; } catch {}
  const m = (navigator.language || "").match(/[-_]([A-Za-z]{2})$/);
  return m ? m[1].toLowerCase() : "";
};

export default function DomainSearchPopup(props: {
  t: Dict;
  rtl: boolean;
  homeTld: string; // visitor's country TLD, shown directly under .teos
  name: string;
  teos: Row | null; // availability of name.teos, null while loading
  tlds: TldInfo[];
  ownsTeos: boolean; // UI hint from this browser; the server checks wallet ownership at registration
  founder: boolean; // searched name is the genesis name
  open: boolean; // registration open
  busy: boolean;
  onBuy: (tlds: string[]) => void;
  onClose: () => void;
}) {
  const { t, rtl, homeTld, name, teos, tlds, ownsTeos, founder, open, busy, onBuy, onClose } = props;
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Record<string, Row>>({});
  const fetched = useRef<Set<string>>(new Set());

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const countries = useMemo(() => tlds.filter((x) => x.live && x.tld !== "teos"), [tlds]);
  const home = countries.find((x) => x.tld === homeTld);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\./, "");
    if (!q) return home ? [home] : [];
    const list = countries.filter((x) => x.tld.startsWith(q) || (x.name ?? "").toLowerCase().includes(q) || (x.region ?? "").toLowerCase().includes(q));
    return [...list].sort((a, b) => Number(b.tld === homeTld) - Number(a.tld === homeTld)).slice(0, 6);
  }, [query, countries, home, homeTld]);

  // Availability for the rows on screen only.
  useEffect(() => {
    const need = visible.map((x) => x.tld).filter((x) => !fetched.current.has(x));
    if (!need.length || !name) return;
    need.forEach((x) => fetched.current.add(x));
    fetch(`/api/check?name=${encodeURIComponent(name)}&tlds=${need.join(",")}`)
      .then((r) => r.json())
      .then((j) => j?.results && setRows((p) => ({ ...p, ...Object.fromEntries(j.results.map((x: Row) => [x.tld, x])) })))
      .catch(() => need.forEach((x) => fetched.current.delete(x)));
  }, [visible, name]);

  const unlocked = ownsTeos || founder;
  const teosFree = !!teos?.available;
  const canBuy = open && !busy;

  const countryCard = (c: TldInfo, tag: string) => {
    const r = rows[c.tld];
    const free = r?.available;
    const bundle = teosFree && !unlocked;
    return (
      <div key={c.tld} style={{ background: "#241f1a", border: "1px solid #3d352a", padding: 12, boxShadow: "inset 0 2px 8px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Flag t={c} />
          <span dir="ltr" style={{ fontFamily: SERIF, fontSize: 18, flex: 1, wordBreak: "break-all", textAlign: rtl ? "right" : "left" }}>{name}.{c.tld} <span style={{ color: "#a89a80", fontSize: 13 }}>{c.name}{tag ? ` • ${tag}` : ""}</span></span>
          <span style={{ fontFamily: MONO, fontSize: 12, color: !r ? "#a89a80" : free ? "#4ade80" : "#f87171" }}>{!r ? "..." : free ? t.availableU : t.takenU}</span>
        </div>
        {free && (bundle || unlocked) && (
          <div style={{ marginTop: 8 }}>
            <button style={{ ...gold, padding: "8px 14px", fontSize: 13, opacity: canBuy ? 1 : 0.6 }} disabled={!canBuy} onClick={() => onBuy(bundle ? ["teos", c.tld] : [c.tld])}>
              {bundle ? fmt(t.bundleBtn, { n: name, t: c.tld, p: ((teos?.price_usd ?? 0) + r.price_usd).toString() }) : fmt(t.buyCountry, { n: name, t: c.tld, p: r.price_usd })}
            </button>
          </div>
        )}
        {free && !bundle && !unlocked && (
          <div style={{ marginTop: 8, fontSize: 13 }}>
            <div style={{ color: "#fca5a5", marginBottom: 6 }}>{fmt(t.needsFirst, { n: name })}</div>
            <button style={greyBtn} disabled>.teos</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div dir={rtl ? "rtl" : "ltr"} role="dialog" aria-modal="true" aria-label={name} onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(5,4,3,.82)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "40px 16px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 620, background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #57493a", boxShadow: "0 20px 60px rgba(0,0,0,.8), inset 0 2px 12px rgba(0,0,0,.6)", padding: 20, color: "#f5e6c4", position: "relative" }}>
        <button onClick={onClose} aria-label={t.close} style={{ position: "absolute", top: 8, insetInlineEnd: 10, background: "none", border: 0, color: "#a89a80", fontSize: 24, cursor: "pointer" }}>×</button>
        <div style={{ fontFamily: SERIF, letterSpacing: "0.2em", color: "#a89a80", fontSize: 12 }}>{t.searched}</div>
        <div dir="ltr" style={{ fontFamily: SERIF, fontSize: 28, color: "#fef3c7", marginBottom: 14, wordBreak: "break-all", textAlign: rtl ? "right" : "left" }}>{name}</div>

        {founder ? (
          <div style={{ background: "linear-gradient(160deg,#3a2a08,#1a1611)", border: "3px double #eab308", padding: 20, textAlign: "center", boxShadow: "0 0 40px rgba(234,179,8,.25)" }}>
            <div style={{ display: "flex", justifyContent: "center" }}><FounderSeal size={120} /></div>
            <div style={{ fontFamily: SERIF, color: "#eab308", letterSpacing: "0.18em", fontWeight: 700, marginTop: 10 }}>{t.genesis}</div>
            <div dir="ltr" style={{ fontFamily: SERIF, fontSize: 30, color: "#fef3c7", margin: "6px 0" }}>elMahrosa.teos</div>
            <div style={{ color: "#a89a80", fontSize: 14 }}>{t.claimed}</div>
          </div>
        ) : (
          <>
            {/* name.teos first: can be bought alone */}
            <div style={{ background: "#d4c5a9", color: "#2a2520", border: "3px double #713f12", padding: 18, boxShadow: "0 8px 24px rgba(0,0,0,.6)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                <span dir="ltr" style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: "#451a03", wordBreak: "break-all" }}>{name}.teos</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: !teos ? "#57493a" : teosFree ? "#14532d" : "#7f1d1d" }}>
                  {!teos ? t.checking : teosFree ? t.availableU : teos.reason === "reserved" ? t.reservedU : t.takenU}
                </span>
              </div>
              <div style={{ margin: "6px 0 10px" }}>
                <span style={{ background: "#7f1d1d", color: "#fde68a", fontSize: 11, letterSpacing: "0.1em", padding: "2px 8px", fontWeight: 700 }}>{t.rootBadge}</span>
              </div>
              {teos && (
                <div style={{ fontFamily: MONO, marginBottom: 10 }}>
                  ${teos.price_usd} {teos.is_promo ? t.foundersPrice : t.standardPrice}
                </div>
              )}
              {teosFree && (
                <button style={{ ...gold, opacity: canBuy ? 1 : 0.6 }} disabled={!canBuy} onClick={() => onBuy(["teos"])}>
                  {fmt(t.carve, { n: name })}
                </button>
              )}
              {teosFree && !open && <div style={{ fontSize: 13, marginTop: 8 }}>{t.soon}</div>}
              {ownsTeos && !teosFree && <div style={{ fontSize: 13, color: "#14532d", fontWeight: 700 }}>{fmt(t.holdTeos, { n: name })}</div>}
            </div>

            {/* visitor's country second, shown directly */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily: SERIF, letterSpacing: "0.15em", fontSize: 13, color: "#a89a80", marginBottom: 6 }}>{query.trim() ? t.otherCountry : t.yourCountry}</div>
              <div style={{ maxHeight: 340, overflowY: "auto", display: "grid", gap: 8 }}>
                {visible.map((c) => countryCard(c, c.tld === homeTld ? t.yourCountryTag : ""))}
                {query.trim() && visible.length === 0 && <div style={{ color: "#a89a80", fontSize: 14 }}>{t.noMatch}</div>}
              </div>
              <input
                id="country"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.countryPh2}
                style={{ display: "block", width: "100%", boxSizing: "border-box", background: "#c9b896", color: "#2a2520", border: "1px solid #8a7550", borderInline: "8px double #7a6540", padding: "10px 12px", fontSize: 16, marginTop: 10 }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
