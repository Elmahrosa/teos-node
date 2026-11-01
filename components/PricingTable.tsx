import type { Dict } from "../lib/i18n";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const cell: React.CSSProperties = { padding: "10px 12px", borderTop: "1px solid #3d352a" };

type Tiers = { promo: number; long: number; four: number; short: number };

export default function PricingTable({ t, tiers, solUsd }: { t: Dict; tiers: Tiers; solUsd: number | null }) {
  const sol = (usd: number) => (solUsd ? ` (~${(usd / solUsd).toFixed(usd < 100 ? 3 : 2)} SOL)` : "");
  // 3 and 4 letter names are never part of the genesis price, so both columns show the same number.
  const rows: [string, number, number][] = [
    [t.p5, tiers.promo, tiers.long],
    [t.p4, tiers.four, tiers.four],
    [t.p3, tiers.short, tiers.short],
  ];
  return (
    <div style={{ background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #3d352a", borderRadius: 4, padding: 16, boxShadow: "inset 0 2px 12px rgba(0,0,0,.6)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: "#eab308", fontFamily: SERIF, letterSpacing: "0.08em", textAlign: "start" }}>
            <th style={{ padding: "6px 12px", textAlign: "start" }}>{t.ptName}</th>
            <th style={{ padding: "6px 12px", textAlign: "start" }}>{t.ptFirst}</th>
            <th style={{ padding: "6px 12px", textAlign: "start" }}>{t.ptAfter}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, first, after]) => (
            <tr key={label}>
              <td style={cell}>{label}</td>
              <td style={{ ...cell, fontFamily: "ui-monospace, monospace" }}>${first}{sol(first)}</td>
              <td style={{ ...cell, fontFamily: "ui-monospace, monospace" }}>${after}{sol(after)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ margin: "12px 0 0", color: "#d6cbb5", fontSize: 14 }}>{t.ptNote}</p>
      <p style={{ margin: "4px 0 0", color: "#a89a80", fontSize: 13 }}>{t.ptPay}</p>
    </div>
  );
}
