"use client";
import { useState } from "react";
export default function CloneGate({ domain }) {
  const [url, setUrl] = useState("");
  const handleClone = async () => {
    if (!url) return alert("حط لينك موقعك القديم");
    const target = domain || "my.teos";
    window.location.href = "/api/clone?from=" + encodeURIComponent(url) + "&to=" + encodeURIComponent(target);
  };
  return (
    <div style={{ background: "#18181b", padding: 16, borderRadius: 16, marginTop: 12 }}>
      <h3 style={{ color: "#fff", fontWeight: 900 }}>📥 انسخ موقعك القديم هنا</h3>
      <p style={{ color: "#a1a1aa", fontSize: 13 }}>حط لينك موقعك القديم وهننقله لك على TEOS</p>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://mysite.com" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #333", background: "#000", color: "#fff", marginTop: 8 }} />
      <button onClick={handleClone} style={{ width: "100%", marginTop: 10, background: "#eab308", color: "#000", padding: 12, borderRadius: 9999, fontWeight: 900, border: 0, cursor: "pointer" }}>انسخ الآن →</button>
    </div>
  );
}