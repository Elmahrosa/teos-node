"use client";
import { useEffect, useState } from "react";

// Gated server-side by middleware.ts (no valid founder session = redirect) and again by /api/visits.
export default function Founder() {
  const [total, setTotal] = useState<number | null>(null);
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/visits").then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then((d) => { setTotal(typeof d.total === "number" ? d.total : null); setCountries(d.countries || []); }).catch((s) => { if (s === 401) window.location.href = "/founder/login"; });
  }, []);

  async function logout() {
    await fetch("/api/founder/login", { method: "DELETE" });
    window.location.href = "/founder/login";
  }

  return (
    <div style={{ padding: 20, background: "#000", color: "#fff", minHeight: "100vh", fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20 }}>Founder - AYMAN.TEOS</h1>
        <button onClick={logout} style={{ background: "none", border: "1px solid #444", color: "#fff", borderRadius: 9999, padding: "6px 14px", cursor: "pointer" }}>Logout</button>
      </div>
      <div style={{ fontSize: 60, fontWeight: 900, textAlign: "center", margin: "20px 0" }}>
        {total ?? "—"}
        <div style={{ fontSize: 16, fontWeight: 400 }}>{total === null ? "Visitor tracking not enabled" : "Real visitors"}</div>
      </div>
      <div style={{ textAlign: "center", fontSize: 22, marginBottom: 8 }}>Countries unlocked {countries.length} / 127</div>
      <div style={{ textAlign: "center", opacity: 0.6, marginBottom: 28 }}>{countries.length ? countries.join(" ") : "0"}</div>
    </div>
  );
}