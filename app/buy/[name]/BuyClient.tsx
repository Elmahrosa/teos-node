"use client";
import { useState } from "react";

type C = { tld: string; flag: string };

export default function BuyClient({ name, countries }: { name: string; countries: C[] }) {
  const [sel, setSel] = useState<string | null>(countries[0]?.tld ?? null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Price comes only from the existing /api/quote (pricing.json + live SOL rate). Nothing is hardcoded here.
  async function mint() {
    if (!sel) return;
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain: name, tlds: sel }) });
      const j = await r.json();
      if (!r.ok || j.error) setMsg(j.error === "registration_closed" ? "Registration is not open yet" : (j.error || "Quote unavailable"));
      else if (j.available === false) setMsg(`Not available: ${j.reason ?? ""}`);
      else setMsg(`Price: $${j.price_usd} (${j.price_sol} SOL)`);
    } catch { setMsg("Quote unavailable"); }
    setBusy(false);
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginTop: 20 }}>
        {countries.map((c) => (
          <button key={c.tld} onClick={() => setSel(c.tld)} aria-pressed={sel === c.tld}
            style={{ background: sel === c.tld ? "#ca8a04" : "#222", color: sel === c.tld ? "#000" : "#fff", padding: 14, border: "1px solid #57493a", cursor: "pointer" }}>
            {c.flag} {name}.{c.tld}<br />{sel === c.tld ? "Selected" : "Select"}
          </button>
        ))}
      </div>
      <button disabled={!sel || busy} onClick={mint}
        style={{ background: "#ca8a04", color: "#000", padding: 15, width: "100%", marginTop: 20, fontSize: 18, fontWeight: 700 }}>
        Mint Now - {name}.{sel}
      </button>
      {msg && <p className="mt-3 text-center">{msg}</p>}
    </>
  );
}
