import FounderSeal from "./FounderSeal";
import { fmt, type Dict } from "../lib/i18n";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const box: React.CSSProperties = { background: "#d4c5a9", color: "#2a2520", border: "3px double #7a6540", padding: 16 };
const h: React.CSSProperties = { fontFamily: SERIF, margin: "0 0 8px", fontSize: 16, letterSpacing: "0.06em", color: "#451a03" };
const a: React.CSSProperties = { color: "#7f1d1d", fontWeight: 700 };

// Mint addresses come from /api/stats (stats.mints), same order as stats.founders.
export default function TrustSection({ t, founders, mints }: { t: Dict; founders: string[]; mints: string[] }) {
  return (
    <section aria-labelledby="trust" style={{ margin: "16px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", marginBottom: 14 }}>
        <FounderSeal size={56} ticker={false} />
        <h2 id="trust" style={{ fontFamily: SERIF, letterSpacing: "0.1em", color: "#fef3c7", margin: 0 }}>{t.trustTitle}</h2>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <div style={box}>
          <h3 style={h}>{t.trustProof}</h3>
          {mints.map((m, i) => (
            <p key={m} style={{ margin: "0 0 8px" }}>
              {fmt(t.trustMinted, { n: founders[i] ?? m.slice(0, 6) })}{" "}
              <a style={a} href={`https://solscan.io/token/${m}`} target="_blank" rel="noopener noreferrer">{t.trustView}</a>
            </p>
          ))}
          <p style={{ margin: 0, fontSize: 14 }}>{t.trustStd}</p>
        </div>
        <div style={box}>
          <h3 style={h}>{t.trustGet}</h3>
          <p style={{ margin: 0 }}>{t.trustGetText}</p>
        </div>
        <div style={box}>
          <h3 style={h}>{t.trustPolicy}</h3>
          <p style={{ margin: "0 0 8px" }}>{t.trustPolicyText}</p>
          <a style={a} href="/terms">{t.terms}</a> · <a style={a} href="/privacy">{t.privacy}</a>
        </div>
      </div>
    </section>
  );
}
