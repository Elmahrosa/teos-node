"use client";
import { useEffect, useState } from "react";

// Protected by middleware (valid founder session required) and by /api/visits, which checks the cookie again.
export default function Founder() {
  const [total, setTotal] = useState(0);
  const [countries, setCountries] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", wallet: "", ref: "" });
  const [out, setOut] = useState("");
  const RESERVED = ["ayman", "elmahrosa", "teos", "admin", "api", "www", "mail", "root", "support", "web4", "app", "test", "nft", "solana"];
  const isReserved = RESERVED.includes(form.name.trim().toLowerCase().replace(/\.teos$/, ""));

  useEffect(() => {
    fetch("/api/visits").then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then((d) => { setTotal(d.total || 0); setCountries(d.countries || []); }).catch((s) => { if (s === 401) window.location.href = "/founder/login"; });
  }, []);

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    setOut("...");
    const r = await fetch("/api/admin/grant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, allowReserved: isReserved }) });
    const j = await r.json().catch(() => ({}));
    setOut(r.ok ? `OK: ${j.name} -> ${j.wallet.slice(0, 4)}...${j.wallet.slice(-4)} (${j.result})` : `Error: ${j.error || r.status}`);
  }
  async function logout() {
    await fetch("/api/founder/login", { method: "DELETE" });
    window.location.href = "/founder/login";
  }

  const field: React.CSSProperties = { padding: 10, borderRadius: 10, border: "1px solid #333", background: "#111", color: "#fff", fontSize: 15, width: "100%", boxSizing: "border-box" };
  return (
    <div style={{ padding: 20, background: "#000", color: "#fff", minHeight: "100vh", fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20 }}>Founder - AYMAN.TEOS</h1>
        <button onClick={logout} style={{ background: "none", border: "1px solid #444", color: "#fff", borderRadius: 9999, padding: "6px 14px", cursor: "pointer" }}>Logout</button>
      </div>
      <div style={{ fontSize: 60, fontWeight: 900, textAlign: "center", margin: "20px 0" }}>
        {total}
        <div style={{ fontSize: 16, fontWeight: 400 }}>Real visitors</div>
      </div>
      <div style={{ textAlign: "center", fontSize: 22, marginBottom: 8 }}>Countries unlocked {countries.length} / 127</div>
      <div style={{ textAlign: "center", opacity: 0.6, marginBottom: 28 }}>{countries.length ? countries.join(" ") : "0"}</div>

      <form onSubmit={grant} style={{ display: "grid", gap: 10, border: "1px solid #333", borderRadius: 16, padding: 16 }}>
        <b>Record a hand mint (Vodafone Cash / PayPal)</b>
        <input style={field} placeholder="name (without .teos)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input style={field} placeholder="Solana wallet address" value={form.wallet} onChange={(e) => setForm({ ...form, wallet: e.target.value })} />
        {isReserved && <div style={{ fontSize: 13, color: "#fde68a" }}>Reserved founder name: will be recorded with allowReserved.</div>}
        <input style={field} placeholder="payment reference (optional)" value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} />
        <button style={{ padding: 12, borderRadius: 9999, border: 0, background: "#eab308", color: "#000", fontWeight: 900, cursor: "pointer" }}>Unlock site for this wallet</button>
        {out && <div style={{ fontSize: 14, wordBreak: "break-all" }}>{out}</div>}
      </form>
    </div>
  );
}
