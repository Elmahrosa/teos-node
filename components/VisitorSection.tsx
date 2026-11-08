"use client";
import { useEffect, useState } from "react";
import type { Lang } from "../lib/i18n";
import type { VisitorStats } from "../lib/visitors";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const T = {
  en: { title: "Where The World Is Joining From", nations: "Nations", joined: "Joined", visits: "Total Visits", v: "visits", j: "joined", privacy: "Anonymous - country only, no personal data stored" },
  ar: { title: "منين دخلت المحروسة", nations: "دولة", joined: "انضم", visits: "إجمالي الزيارات", v: "زيارة", j: "انضم", privacy: "مجهول - الدولة فقط، لا يتم تخزين أي بيانات شخصية" },
  id: { title: "Dari Mana Dunia Bergabung", nations: "Negara", joined: "Bergabung", visits: "Total Kunjungan", v: "kunjungan", j: "bergabung", privacy: "Anonim - hanya negara, tidak ada data pribadi disimpan" },
} as const;

const SESSION_KEY = "teos_visit_counted";

// Counts once per browser session (sessionStorage, not a cookie), then shows country totals.
export function useVisitorStats(): VisitorStats | null {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  useEffect(() => {
    let counted = false;
    try { counted = sessionStorage.getItem(SESSION_KEY) === "1"; } catch {}
    fetch("/api/visit", { method: counted ? "GET" : "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        if (!counted) { try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {} }
        setStats(d);
      })
      .catch(() => {});
  }, []);
  return stats;
}

const pill = { display: "inline-flex", gap: 8, alignItems: "center", padding: "8px 16px", border: "1px solid #ca8a04", borderRadius: 999, background: "rgba(202,138,4,.1)", color: "#fef3c7", fontSize: 14, fontWeight: 700 } as const;

export function StatsBar({ stats, lang }: { stats: VisitorStats | null; lang: Lang }) {
  const t = T[lang];
  const n = (v: number | undefined) => (v === undefined ? "—" : v.toLocaleString("en-US"));
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", margin: "14px 0" }}>
      <span style={pill}>🌍 {n(stats?.nations)} {t.nations}</span>
      <span style={pill}>👥 {n(stats?.joined)} {t.joined}</span>
      <span style={pill}>👁️ {t.visits}: {n(stats?.total)}</span>
    </div>
  );
}

export default function VisitorSection({ stats, lang }: { stats: VisitorStats | null; lang: Lang }) {
  const t = T[lang];
  return (
    <section aria-labelledby="visitors" style={{ margin: "24px 0" }}>
      <h2 id="visitors" dir="auto" style={{ fontFamily: SERIF, letterSpacing: "0.1em", color: "#fef3c7", textAlign: "center", margin: "0 0 14px" }}>{t.title}</h2>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        {(stats?.top ?? []).map((c) => (
          <div key={c.code} dir={lang === "ar" ? "rtl" : "ltr"} style={{ border: "1px solid #3d352a", borderRadius: 8, padding: 14, background: "rgba(20,16,10,.8)", textAlign: "center" }}>
            <div style={{ fontSize: 30 }}>{c.flag}</div>
            <div style={{ color: "#fef3c7", fontWeight: 700 }}>{c.name}</div>
            <div style={{ color: "#fbbf24", fontSize: 14 }}>{c.visits.toLocaleString("en-US")} {t.v}{c.joined > 0 ? ` - ${c.joined} ${t.j}` : ""}</div>
          </div>
        ))}
      </div>
      <p style={{ textAlign: "center", opacity: 0.7, fontSize: 12, margin: "12px 0 0" }}>{t.privacy}</p>
    </section>
  );
}
