import type { Dict } from "../lib/i18n";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const card = (color: string): React.CSSProperties => ({ background: "#1a1611", border: `1px solid ${color}`, borderRadius: 6, padding: 14, display: "flex", flexDirection: "column", gap: 8 });

const methods = [
  { name: "SOL", color: "#a78bfa", detail: "Pay with SOL on Solana." },
  { name: "USDC", color: "#60a5fa", detail: "Pay with USDC on Solana." },
  { name: "USDT", color: "#4ade80", detail: "Pay with USDT on Solana." },
];

export default function PaymentOptions({ rtl }: { t: Dict; rtl: boolean }) {
  return (
    <section id="payment" dir={rtl ? "rtl" : "ltr"} style={{ background: "#0a0806", border: "2px solid #ca8a04", borderRadius: 8, padding: 16, margin: "24px 0" }}>
      <h3 style={{ fontFamily: SERIF, color: "#eab308", textAlign: "center", fontSize: 20, margin: "0 0 14px" }}>Solana payment methods</h3>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        {methods.map(({ name, color, detail }) => (
          <div key={name} style={card(color)}>
            <h4 style={{ margin: 0, color }}>{name}</h4>
            <p style={{ margin: 0, fontSize: 13, color: "#f5e6c4" }}>{detail}</p>
            <p style={{ margin: "auto 0 0", fontSize: 12, color: "#a89a80" }}>Network: Solana</p>
          </div>
        ))}
      </div>
    </section>
  );
}
