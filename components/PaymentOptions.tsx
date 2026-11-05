"use client";

import type { Dict } from "../lib/i18n";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";

export default function PaymentOptions({ t, rtl }: { t: Dict; rtl: boolean }) {
  return (
    <section
      id="payment"
      dir={rtl ? "rtl" : "ltr"}
      style={{
        background: "#0a0806",
        border: "2px solid #ca8a04",
        borderRadius: 8,
        padding: 16,
        margin: "24px 0",
      }}
    >
      <h3
        style={{
          fontFamily: SERIF,
          color: "#eab308",
          textAlign: "center",
          fontSize: 20,
          margin: "0 0 14px",
        }}
      >
        {t.payTitle}
      </h3>

      <div
        style={{
          background: "#1a1611",
          border: "1px solid #7c3aed",
          borderRadius: 6,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <h4 style={{ margin: 0, color: "#a78bfa" }}>{t.pay1T}</h4>
        <p style={{ margin: 0, fontSize: 13, color: "#f5e6c4" }}>
          {t.pay1D}
        </p>
        <p style={{ margin: "auto 0 0", fontSize: 13, color: "#4ade80" }}>
          {t.pay1Cta}
        </p>
      </div>
    </section>
  );
}
