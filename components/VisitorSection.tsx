"use client";
import { useEffect, useState } from "react";
import type { Lang } from "../lib/i18n";
import type { VisitorStats } from "../lib/visitors";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const T = {
  en: { title: "Where The World Is Joining From", nations: "Nations", joined: "Joined", visited: "Countries visited", visits: "Total Visits", v: "visits", v1: "visit", unknown: "Unknown", empty: "No visits recorded yet.", j: "joined", privacy: "Anonymous - country only, no personal data stored" },
  ar: { title: "منين دخلت المحروسة", nations: "دولة", joined: "انضم", visited: "دول زارت", visits: "إجمالي الزيارات", v: "زيارة", v1: "زيارة", unknown: "غير معروف", empty: "لا توجد زيارات بعد.", j: "انضم", privacy: "مجهول - الدولة فقط، لا يتم تخزين أي بيانات شخصية" },
  id: { title: "Dari Mana Dunia Bergabung", nations: "Negara", joined: "Bergabung", visited: "Negara pengunjung", visits: "Total Kunjungan", v: "kunjungan", v1: "kunjungan", unknown: "Tidak diketahui", empty: "Belum ada kunjungan.", j: "bergabung", privacy: "Anonim - hanya negara, tidak ada data pribadi disimpan" },
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

const pill = { display: "inline-flex", gap: 8, alignItems: "center", padding: "8px 16px", border: "1px solid #b8973f", borderRadius: 999, background: "rgba(184,151,63,.1)", color: "#f1e7cf", fontSize: 14, fontWeight: 700 } as const;
const fmtN = (v: number | undefined) => (v === undefined ? "—" : v.toLocaleString("en-US"));

// Home: ONE counter. Nations is the fixed sovereign-namespace count; Joined comes from the member list.
export function StatsBar({ nations, joined, lang }: { nations: number; joined: number; lang: Lang }) {
  const t = T[lang];
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", margin: "18px 0" }}>
      <span style={pill}>🌍 {fmtN(nations)} {t.nations}</span>
      <span style={pill}>👥 {fmtN(joined)} {t.joined}</span>
    </div>
  );
}

// World page: the real totals. Total visits is the sum of every row below (Unknown included).
export function WorldTotals({ stats, lang }: { stats: VisitorStats | null; lang: Lang }) {
  const t = T[lang];
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", margin: "22px 0 0" }}>
      <span style={pill}>🌍 {fmtN(stats?.nations)} {t.visited}</span>
      <span style={pill}>👁️ {t.visits}: {fmtN(stats?.total)}</span>
    </div>
  );
}

export default function VisitorSection({ stats, lang, h1 = false }: { stats: VisitorStats | null; lang: Lang; h1?: boolean }) {
  const t = T[lang];
  const H = h1 ? "h1" : "h2";
  const rows = stats?.top ?? [];
  return (
    <section aria-labelledby="visitors" style={{ margin: "8px 0" }}>
      <H id="visitors" dir="auto" style={{ fontFamily: SERIF, fontWeight: 400, letterSpacing: "0.12em", color: "#f1e7cf", textAlign: "center", margin: "0 0 22px" }}>{t.title.toUpperCase()}</H>
      {rows.length === 0 && stats && <p style={{ textAlign: "center", opacity: 0.7 }}>{t.empty}</p>}
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
        {rows.map((c) => (
          <div key={c.code} dir={lang === "ar" ? "rtl" : "ltr"} style={{ border: "1px solid #3d352a", borderRadius: 6, padding: 14, background: "#17130f", textAlign: "center" }}>
            <div style={{ fontSize: 30 }}>{c.flag}</div>
            <div style={{ color: "#f1e7cf", fontWeight: 700 }}>{c.code === "ZZ" ? t.unknown : c.name}</div>
            <div style={{ color: "#d9c48a", fontSize: 14 }}>{c.visits.toLocaleString("en-US")} {c.visits === 1 ? t.v1 : t.v}{c.joined > 0 ? ` - ${c.joined} ${t.j}` : ""}</div>
          </div>
        ))}
      </div>
      <p style={{ textAlign: "center", opacity: 0.7, fontSize: 12, margin: "16px 0 0" }}>{t.privacy}</p>
    </section>
  );
}
