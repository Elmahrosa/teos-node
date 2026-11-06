import type { Dict } from "../lib/i18n";
import { PRICE_TIERS, LENGTH_LABELS, PAYMENT_LABEL } from "../lib/pricing";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const cell: React.CSSProperties = { padding: "6px 0", borderTop: "1px solid #3d352a", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 };

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

// Prices come only from core/pricing.json via lib/pricing.ts.
export default function PricingTable({ t, solUsd }: { t: Dict; solUsd: number | null }) {
  const sol = (usd: number) => (solUsd ? `~${(usd / solUsd).toFixed(usd < 100 ? 3 : 2)} SOL` : "");
  return (
    <div style={{ background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #3d352a", borderRadius: 4, padding: 16, boxShadow: "inset 0 2px 12px rgba(0,0,0,.6)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {PRICE_TIERS.map((tier) => (
          <section key={tier.id} aria-label={tier.id} style={{ border: "1px solid #3d352a", padding: 12 }}>
            <h3 style={{ margin: 0, color: "#eab308", fontFamily: SERIF, letterSpacing: "0.08em", fontSize: 17 }}>{tier.id.toUpperCase()}</h3>
            <p dir="ltr" style={{ margin: "2px 0 8px", color: "#a89a80", fontSize: 12, overflowWrap: "anywhere" }}>
              {tier.tlds === null ? "all other TLDs" : tier.tlds.map((x) => `.${x}`).join(" ")}
            </p>
            {tier.prices.map((usd, i) => (
              <div key={i} style={cell}>
                <bdi dir="ltr" style={{ whiteSpace: "nowrap" }}>{LENGTH_LABELS[i]}</bdi>
                <span dir="ltr" style={{ textAlign: "end" }}>
                  <span style={{ fontFamily: "ui-monospace, monospace" }}>{fmt(usd)}</span>
                  <small style={{ display: "block", color: "#a89a80", fontSize: 11 }}>{PAYMENT_LABEL}{sol(usd) ? ` · ${sol(usd)}` : ""}</small>
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
      <p style={{ margin: "12px 0 0", color: "#d6cbb5", fontSize: 14 }}>{t.ptNote}</p>
      <p style={{ margin: "4px 0 0", color: "#a89a80", fontSize: 13 }}>{t.ptPay}</p>
    </div>
  );
}
