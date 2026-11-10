"use client";
import type { ReactNode } from "react";
import { useLang } from "../lib/useLang";
import InsideTeos from "./InsideTeos";

// "What you get when you buy": owner-approved copy. Short-form names always carry the "inside TEOS" badge.
export default function WhatYouGet({ compact, collapsible }: { compact?: boolean; collapsible?: boolean }) {
  const { L, rtl } = useLang();
  const withNames = (s: string): ReactNode[] =>
    s.split(/(\{n\}|\{s\})/).map((p, i) =>
      p === "{n}" ? <span key={i} dir="ltr"><b>AYMAN.EG</b><InsideTeos t={L} /></span>
      : p === "{s}" ? <span key={i} dir="ltr"><b>SHOP.AYMAN.EG</b><InsideTeos t={L} /></span>
      : p);
  const rows: [string, string][] = [
    [L.gOwnH, L.gOwn], [L.gProfH, L.gProf], [L.gWalH, L.gWal], [L.gMailH, L.gMail], [L.gSubH, L.gSub], [L.gFreeH, L.gFree],
  ];
  const body = (
    <>
      <ul style={{ margin: "10px 0", paddingInlineStart: 20, fontSize: compact ? 12 : 14, lineHeight: 1.6 }}>
        {rows.map(([h, b]) => (<li key={h}><b>{h}:</b> {h === L.gMailH ? <span dir="ltr">{b}</span> : withNames(b)}</li>))}
      </ul>
      <p style={{ margin: "6px 0 0", fontSize: compact ? 12 : 14, color: "#eab308" }}>{L.teosIdWorks}</p>
    </>
  );
  return (
    <section data-testid="what-you-get" dir={rtl ? "rtl" : "ltr"} style={{ margin: compact ? "12px 0 0" : "28px auto", maxWidth: 820, padding: compact ? 10 : 20, border: "1px solid #57493a", borderRadius: 6, background: "rgba(26,22,17,.7)", color: "#f5e6c4", textAlign: "start" }}>
      {collapsible ? (
        <details><summary style={{ cursor: "pointer", fontWeight: 700 }}>{L.gTitle}</summary>{body}</details>
      ) : (
        <><h2 style={{ margin: 0, fontFamily: "Cinzel, Georgia, serif", color: "#fef3c7", fontSize: compact ? 15 : 22 }}>{L.gTitle}</h2>{body}</>
      )}
    </section>
  );
}
