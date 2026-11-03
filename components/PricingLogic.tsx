"use client";
import { useEffect } from "react";
import Bidi from "./Bidi";
import type { TFn } from "../lib/locales";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const box: React.CSSProperties = { background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #3d352a", borderRadius: 4, padding: 20, margin: "16px 0", boxShadow: "inset 0 2px 12px rgba(0,0,0,.6)" };
const h: React.CSSProperties = { fontFamily: SERIF, color: "#fef3c7", letterSpacing: "0.08em", margin: "0 0 10px", fontSize: 20 };
const p: React.CSSProperties = { margin: "6px 0", color: "#e7dcc3", lineHeight: 1.6 };

// How the root rule works, the price rules, and the country TLDs grouped by region (counted from tlds/all.json).
export default function PricingLogic({ t, tlds }: { t: TFn; tlds: { tld: string; region: string }[] }) {
  const countries = tlds.filter((x) => x.tld !== "teos");
  const groups = new Map<string, number>();
  for (const x of countries) groups.set(x.region, (groups.get(x.region) ?? 0) + 1);
  const rows = Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  useEffect(() => {
    if (tlds.length && tlds.length !== 125 && process.env.NODE_ENV === "development") console.warn(`[tlds] expected 125 including .teos, found ${tlds.length}`);
  }, [tlds.length]);
  return (
    <section aria-labelledby="how" style={box}>
      <h2 id="how" style={h}>{t("pricing.howTitle")}</h2>
      <p dir="auto" style={p}><Bidi text={t("pricing.how1")} /></p>
      <p dir="auto" style={p}><Bidi text={t("pricing.how2")} /></p>
      <h3 style={{ ...h, fontSize: 17, marginTop: 18 }}>{t("pricing.priceTitle")}</h3>
      {["price5", "price4", "price3"].map((k) => <p key={k} dir="auto" style={p}><Bidi text={t(`pricing.${k}`)} /></p>)}
      <p dir="auto" style={p}><Bidi text={t("pricing.ownership")} /></p>
      {rows.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14, fontSize: 15 }}>
          <tbody>
            {rows.map(([region, n]) => (
              <tr key={region} style={{ borderTop: "1px solid #3d352a" }}>
                <td style={{ padding: "6px 4px", textAlign: "start" }}><bdi dir="ltr">{region}</bdi></td>
                <td style={{ padding: "6px 4px", textAlign: "end", fontFamily: "ui-monospace, monospace", color: "#eab308" }}>{n}</td>
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid #7a6540", fontWeight: 700 }}>
              <td style={{ padding: "6px 4px", textAlign: "start" }}>{countries.length}</td>
              <td />
            </tr>
          </tbody>
        </table>
      )}
    </section>
  );
}
