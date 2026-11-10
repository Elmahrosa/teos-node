"use client";
import { useEffect, useState } from "react";
import InsideTeos from "../../../components/InsideTeos";
import { displayName, needsBadge } from "../../../lib/display";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { getRouteForUser } from "../../../lib/domain";

type C = { tld: string; flag: string };

export default function BuyClient({ name, countries }: { name: string; countries: C[] }) {
  const [sel, setSel] = useState<string | null>(countries[0]?.tld ?? null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";

  // Owner of this name (wallet holds name.teos) goes to the founder page instead of the buyer page.
  useEffect(() => {
    if (!wallet) return;
    let live = true;
    fetch(`/api/owns-teos?wallet=${encodeURIComponent(wallet)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!live || !Array.isArray(j?.names)) return;
        const owner = j.names.includes(name) ? wallet : null;
        const route = getRouteForUser(name, owner, wallet);
        if (route !== `/buy/${name}`) router.replace(route);
      })
      .catch(() => {});
    return () => { live = false; };
  }, [wallet, name, router]);

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
            {c.flag} {displayName(name, c.tld)}{needsBadge(c.tld) && <InsideTeos />}<br />{sel === c.tld ? "Selected" : "Select"}
          </button>
        ))}
      </div>
      <button disabled={!sel || busy} onClick={mint}
        style={{ background: "#ca8a04", color: "#000", padding: 15, width: "100%", marginTop: 20, fontSize: 18, fontWeight: 700 }}>
        Mint Now - {displayName(name, sel ?? "teos")}{sel && needsBadge(sel) && <InsideTeos />}
      </button>
      {msg && <p className="mt-3 text-center">{msg}</p>}
    </>
  );
}
