import { fmt, type Dict } from "../lib/i18n";

// Founder-written welcome copy (approved by Ayman). The SOL amount comes from the live rate, never hardcoded.
export default function FounderIntro({ t, rtl, tlds, solUsd }: { t: Dict; rtl: boolean; tlds: number; solUsd: number | null }) {
  const sol = solUsd ? ` (~${(10 / solUsd).toFixed(3)} SOL)` : "";
  return (
    <div dir={rtl ? "rtl" : "ltr"} style={{ borderRadius: 20, border: "1px solid #1F3B44", padding: 24, margin: "16px 0", background: "linear-gradient(160deg,#d4c5a9,#c9b896)", color: "#2a2520", textAlign: "center", lineHeight: 1.6 }}>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>{t.fi1}</p>
      <p style={{ margin: "8px 0" }}>{fmt(t.fi2, { n: tlds || 125, sol })}</p>
      <p style={{ margin: 0 }}>{t.fi3}</p>
    </div>
  );
}
