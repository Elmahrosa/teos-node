"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import FounderSeal from "./FounderSeal";

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

// Country part of the browser locale: "ar-EG" -> "eg". Returns "" when there is none.
export const localeCountry = () => {
  if (typeof navigator === "undefined") return "";
  const m = (navigator.language || "").match(/[-_]([A-Za-z]{2})$/);
  return m ? m[1].toLowerCase() : "";
};

export default function DomainSearchPopup(props: {
  name: string;
  teos: Row | null; // availability of name.teos, null while loading
  tlds: TldInfo[]; // full list, only used once the user focuses or types in the country search
  ownsTeos: boolean; // UI hint from this browser; the server checks wallet ownership at registration
  founder: boolean; // searched name is the genesis name
  open: boolean; // registration open
  busy: boolean;
  onBuy: (tlds: string[]) => void;
  onClose: () => void;
}) {
  const { name, teos, tlds, ownsTeos, founder, open, busy, onBuy, onClose } = props;
  const [query, setQuery] = useState("");
  const [armed, setArmed] = useState(false); // list loads only after focus, typing or a locale match
  const [rows, setRows] = useState<Record<string, Row>>({});
  const home = useMemo(() => localeCountry(), []);
  const fetched = useRef<Set<string>>(new Set());

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const countries = useMemo(() => tlds.filter((t) => t.live && t.tld !== "teos"), [tlds]);
  const visible = useMemo(() => {
    if (!armed && !query && !(home && countries.some((t) => t.tld === home))) return [];
    const q = query.trim().toLowerCase().replace(/^\./, "");
    const list = q
      ? countries.filter((t) => t.tld.startsWith(q) || (t.name ?? "").toLowerCase().includes(q) || (t.region ?? "").toLowerCase().includes(q))
      : countries.filter((t) => t.tld === home);
    // The visitor's own country first, then the rest in list order.
    return [...list].sort((a, b) => Number(b.tld === home) - Number(a.tld === home)).slice(0, 6);
  }, [armed, query, countries, home]);

  // Availability for the rows on screen only.
  useEffect(() => {
    const need = visible.map((t) => t.tld).filter((t) => !fetched.current.has(t));
    if (!need.length || !name) return;
    need.forEach((t) => fetched.current.add(t));
    fetch(`/api/check?name=${encodeURIComponent(name)}&tlds=${need.join(",")}`)
      .then((r) => r.json())
      .then((j) => j?.results && setRows((p) => ({ ...p, ...Object.fromEntries(j.results.map((x: Row) => [x.tld, x])) })))
      .catch(() => need.forEach((t) => fetched.current.delete(t)));
  }, [visible, name]);

  const unlocked = ownsTeos || founder;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Search results for ${name}`} onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(5,4,3,.82)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "40px 16px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 620, background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #57493a", boxShadow: "0 20px 60px rgba(0,0,0,.8), inset 0 2px 12px rgba(0,0,0,.6)", padding: 20, color: "#f5e6c4", position: "relative" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 8, right: 10, background: "none", border: 0, color: "#a89a80", fontSize: 24, cursor: "pointer" }}>×</button>
        <div style={{ fontFamily: SERIF, letterSpacing: "0.2em", color: "#a89a80", fontSize: 12 }}>SEARCHED</div>
        <div dir="ltr" style={{ fontFamily: SERIF, fontSize: 28, color: "#fef3c7", marginBottom: 14, wordBreak: "break-all" }}>{name}</div>

        {founder ? (
          <div style={{ background: "linear-gradient(160deg,#3a2a08,#1a1611)", border: "3px double #eab308", padding: 20, textAlign: "center", boxShadow: "0 0 40px rgba(234,179,8,.25)" }}>
            <div style={{ display: "flex", justifyContent: "center" }}><FounderSeal size={120} /></div>
            <div style={{ fontFamily: SERIF, color: "#eab308", letterSpacing: "0.18em", fontWeight: 700, marginTop: 10 }}>GENESIS 001 • MASTER KEY TO ELMAHROSA</div>
            <div dir="ltr" style={{ fontFamily: SERIF, fontSize: 30, color: "#fef3c7", margin: "6px 0" }}>elMahrosa.teos</div>
            <div style={{ color: "#a89a80", fontSize: 14 }}>Sovereign Root • CLAIMED BY FOUNDER</div>
          </div>
        ) : (
          <>
            {/* name.teos is always first */}
            <div style={{ background: "#d4c5a9", color: "#2a2520", border: "3px double #713f12", padding: 18, boxShadow: "0 8px 24px rgba(0,0,0,.6)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                <span dir="ltr" style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: "#451a03", wordBreak: "break-all" }}>{name}.teos</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: !teos ? "#57493a" : teos.available ? "#14532d" : "#7f1d1d" }}>
                  {!teos ? "CHECKING..." : teos.available ? "AVAILABLE" : teos.reason === "reserved" ? "RESERVED" : "TAKEN"}
                </span>
              </div>
              <div style={{ margin: "6px 0 10px" }}>
                <span style={{ background: "#7f1d1d", color: "#fde68a", fontSize: 11, letterSpacing: "0.15em", padding: "2px 8px", fontWeight: 700 }}>SOVEREIGN ROOT • REQUIRED • GENESIS KEY</span>
              </div>
              {teos && (
                <div style={{ fontFamily: MONO, marginBottom: 10 }}>
                  ${teos.price_usd} {teos.is_promo ? "Founders price (first 100)" : "standard price"}
                </div>
              )}
              {teos?.available && (
                <button style={{ ...gold, opacity: busy || !open ? 0.6 : 1 }} disabled={busy || !open} onClick={() => onBuy(["teos"])}>
                  CARVE {name}.teos IN STONE - BUY NOW
                </button>
              )}
              {teos?.available && !open && <div style={{ fontSize: 13, marginTop: 8 }}>Registration opens soon.</div>}
              {ownsTeos && !teos?.available && <div style={{ fontSize: 13, color: "#14532d", fontWeight: 700 }}>You hold {name}.teos in this browser.</div>}
            </div>

            <div style={{ marginTop: 20 }}>
              <label htmlFor="country" style={{ fontFamily: SERIF, letterSpacing: "0.15em", fontSize: 13, color: "#a89a80" }}>COUNTRY</label>
              <input
                id="country"
                value={query}
                onFocus={() => setArmed(true)}
                onChange={(e) => { setArmed(true); setQuery(e.target.value); }}
                placeholder="Search your country... e.g. Egypt, Saudi, Emirates"
                style={{ display: "block", width: "100%", boxSizing: "border-box", background: "#c9b896", color: "#2a2520", border: "1px solid #8a7550", borderInline: "8px double #7a6540", padding: "10px 12px", fontSize: 16, marginTop: 6 }}
              />
              <div style={{ maxHeight: 340, overflowY: "auto", marginTop: 10, display: "grid", gap: 8 }}>
                {visible.map((t) => {
                  const r = rows[t.tld];
                  const free = r?.available;
                  return (
                    <div key={t.tld} style={{ background: "#241f1a", border: "1px solid #3d352a", padding: 12, boxShadow: "inset 0 2px 8px rgba(0,0,0,.5)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Flag t={t} />
                        <span dir="ltr" style={{ fontFamily: SERIF, fontSize: 18, flex: 1, wordBreak: "break-all" }}>{name}.{t.tld} <span style={{ color: "#a89a80", fontSize: 13 }}>{t.name}{t.tld === home ? " • your country" : ""}</span></span>
                        <span style={{ fontFamily: MONO, fontSize: 12, color: !unlocked ? "#fca5a5" : !r ? "#a89a80" : free ? "#4ade80" : "#f87171" }}>
                          {!unlocked ? "🔒 LOCKED" : !r ? "..." : free ? "AVAILABLE" : "TAKEN"}
                        </span>
                      </div>
                      {!unlocked ? (
                        <div style={{ marginTop: 8, fontSize: 13 }}>
                          <div style={{ color: "#fca5a5", fontWeight: 700 }}>LOCKED - Sovereign Rule: Nothing available if not get TEOS</div>
                          <div style={{ color: "#a89a80", margin: "2px 0 8px" }}>You must carve {name}.teos first to unlock {name}.{t.tld}</div>
                          <button style={greyBtn} disabled>Requires {name}.teos</button>
                        </div>
                      ) : free ? (
                        <div style={{ marginTop: 8 }}>
                          <button style={{ ...gold, padding: "8px 14px", fontSize: 13, opacity: busy || !open ? 0.6 : 1 }} disabled={busy || !open} onClick={() => onBuy([t.tld])}>
                            Unlock {name}.{t.tld} +${r.price_usd}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {armed && visible.length === 0 && <div style={{ color: "#a89a80", fontSize: 14 }}>No country matches.</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
