import type { Dict } from "../lib/i18n";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const cell: React.CSSProperties = { padding: "10px 12px", borderTop: "1px solid #3d352a" };

type Tiers = { one: number; long: number; four: number; short: number };

export default function PricingTable({ t, tiers, solUsd }: { t: Dict; tiers: Tiers; solUsd: number | null }) {
  const sol = (usd: number) => (solUsd ? ` (~${(usd / solUsd).toFixed(usd < 100 ? 3 : 2)} SOL)` : "");
  const rows: [string, number][] = [
    [t.p1, tiers.one],
    [t.p23, tiers.short],
    [t.p4, tiers.four],
    [t.p5, tiers.long],
  ];
  return (
    <div style={{ background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #3d352a", borderRadius: 4, padding: 16, boxShadow: "inset 0 2px 12px rgba(0,0,0,.6)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: "#eab308", fontFamily: SERIF, letterSpacing: "0.08em", textAlign: "start" }}>
            <th style={{ padding: "6px 12px", textAlign: "start" }}>{t.ptName}</th>
            <th style={{ padding: "6px 12px", textAlign: "start" }}>{t.ptPrice}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, usd]) => (
            <tr key={label}>
              <td style={cell}>{label}</td>
              <td style={{ ...cell, fontFamily: "ui-monospace, monospace" }}>${usd}{sol(usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ margin: "12px 0 0", color: "#d6cbb5", fontSize: 14 }}>{t.ptNote}</p>
      <p style={{ margin: "4px 0 0", color: "#a89a80", fontSize: 13 }}>{t.ptPay}</p>
    </div>
  );
}
