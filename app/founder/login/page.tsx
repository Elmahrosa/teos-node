"use client";
import { useState } from "react";

const wrap: React.CSSProperties = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#000", color: "#fff", fontFamily: "sans-serif" };

export default function FounderLogin() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/founder/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
      if (r.ok) { window.location.href = "/founder"; return; }
      const j = await r.json().catch(() => ({}));
      setErr(r.status === 423 ? "Too many attempts. Try again later." : j.error === "rate_limited" ? "Too many tries. Wait a minute." : "Login failed.");
    } catch { setErr("Network error."); }
    setBusy(false);
  }

  return (
    <div style={wrap}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 340, display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Founder login</h1>
        <div style={{ fontSize: 13, opacity: 0.6 }}>AYMAN.TEOS / AYMAN.ELMAHROSA</div>
        <input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" style={{ padding: 12, borderRadius: 12, border: "1px solid #333", background: "#111", color: "#fff", fontSize: 16 }} />
        <button disabled={busy || !pw} style={{ padding: 12, borderRadius: 9999, border: 0, background: "#eab308", color: "#000", fontWeight: 900, fontSize: 16, cursor: "pointer" }}>{busy ? "..." : "Enter"}</button>
        {err && <p role="alert" style={{ color: "#f87171", margin: 0 }}>{err}</p>}
      </form>
    </div>
  );
}