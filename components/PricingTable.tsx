"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { Dict } from "../lib/i18n";
import { PRICE_TIERS, LENGTH_LABELS } from "../lib/pricing";
import PharaohStyles from "./PharaohStyles";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const cell: React.CSSProperties = { padding: "6px 0", borderTop: "1px solid #3d352a", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 };

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

// Prices come only from core/pricing.json via lib/pricing.ts.
export default function PricingTable({ t, onBuy }: { t: Dict; onBuy: () => void }) {
  // Only the .teos prices are public. Country prices show once the connected wallet holds a .teos.
  const { publicKey } = useWallet();
  const [owns, setOwns] = useState(false);
  const wallet = publicKey?.toBase58() ?? "";
  useEffect(() => {
    setOwns(false);
    if (!wallet) return;
    let live = true;
    fetch(`/api/owns-teos?wallet=${encodeURIComponent(wallet)}`, { cache: "no-store" })
      .then((r) => r.json()).then((j) => { if (live) setOwns(j?.owns === true); }).catch(() => {});
    return () => { live = false; };
  }, [wallet]);
  // Live SOL estimate under each USD price: re-read every 30 s and whenever the tab regains focus.
  const [solUsd, setSolUsd] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    const load = () => fetch("/api/sol-price", { cache: "no-store" }).then((r) => r.json()).then((j) => {
      const v = Number(j?.sol_usd);
      if (!live || !Number.isFinite(v) || v <= 0) return;
      setSolUsd((prev) => { if (prev !== null && prev !== v) setTick((n) => n + 1); return v; });
    }).catch(() => {});
    load();
    const iv = setInterval(load, 30_000);
    window.addEventListener("focus", load);
    return () => { live = false; clearInterval(iv); window.removeEventListener("focus", load); };
  }, []);
  const solOf = (usd: number) => (solUsd ? (usd / solUsd).toFixed(usd < 100 ? 3 : 2) : null);
  const tiers = PRICE_TIERS.filter((x) => x.id === "teos");
  return (
    <div style={{ background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #3d352a", borderRadius: 4, padding: 16, boxShadow: "inset 0 2px 12px rgba(0,0,0,.6)" }}>
      <PharaohStyles />
      <div className="pharaoh-tier-grid">
        {tiers.map((tier) => (
          <section key={tier.id} aria-label={tier.id} style={{ border: "2px solid #ca8a04", borderRadius: 8, padding: 18, background: "linear-gradient(160deg,#241f1a,#12100d)", boxShadow: "0 10px 26px rgba(0,0,0,.55),inset 0 1px 0 rgba(254,243,199,.12)" }}>
            <h3 style={{ margin: 0, color: "#fbbf24", fontFamily: SERIF, letterSpacing: "0.1em", fontSize: 20 }}>{tier.id.toUpperCase()}</h3>
            <p dir="ltr" style={{ margin: "2px 0 8px", color: "#a89a80", fontSize: 12, overflowWrap: "anywhere" }}>
              {tier.tlds === null ? "all other namespaces" : tier.tlds.map((x) => `.${x}`).join(" ")}
            </p>
            {tier.prices.map((usd, i) => (
              <div key={i} dir="ltr" className="pt-row" style={cell}>
                <bdi dir="ltr" className="pt-len" style={{ whiteSpace: "nowrap" }}>{LENGTH_LABELS[i]}</bdi>
                <span dir="ltr" className="pt-amt" style={{ textAlign: "end" }}>
                  <span className="pt-usd" style={{ fontFamily: "ui-monospace, monospace", fontSize: 18, fontWeight: 700, color: "#fde68a" }}>{fmt(usd)}</span>
                  {solOf(usd) && (
                    <span className="pt-live" aria-live="off" style={{ display: "block", fontSize: 12, color: "#4ade80", marginTop: 2 }}>
                      <span className="pt-dot" aria-hidden="true" />Live: <span key={tick} className="pt-flash" style={{ fontFamily: "ui-monospace, monospace" }}>~{solOf(usd)} SOL</span>
                    </span>
                  )}
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
