"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import MintModal, { type MintQuote } from "../../../components/MintModal";
import { useLang } from "../../../lib/useLang";
import { SOCIAL } from "../../../lib/social";

type Row = { tld: string; flag: string; label: string; domain: string; price_usd: number; status: "owned" | "available" | "reserved" };
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...Array.from(u)));
const COLOR = { owned: "#555", available: "#16a34a", reserved: "#a16207" } as const;

export default function DashboardClient({ name }: { name: string }) {
  const { publicKey, signMessage } = useWallet();
  const { L, rtl } = useLang();
  const [mintQuote, setMintQuote] = useState<MintQuote | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [notOwner, setNotOwner] = useState(false);
  const [avail, setAvail] = useState<string | null>(null);
  const [sel, setSel] = useState<Row | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!publicKey || !signMessage) { setMsg("Connect a wallet that can sign messages"); return; }
    setBusy(true); setMsg(null); setNotOwner(false);
    try {
      const ts = Date.now();
      const sig = await signMessage(new TextEncoder().encode(`teos://dashboard/${name}/${ts}`));
      const r = await fetch(`/api/dashboard/${encodeURIComponent(name)}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ publicKey: publicKey.toBase58(), signature: b64(sig), ts }),
      });
      const j = await r.json();
      if (r.ok) setRows(j.rows);
      else if (j.error === "not_owner") {
        setNotOwner(true);
        const a = await (await fetch(`/api/availability?domain=${encodeURIComponent(name)}`)).json();
        setAvail(a.available ? `${name}.teos is available` : `${name}.teos is not available`);
      } else setMsg(j.error === "ownership_check_unavailable" ? "Ownership check unavailable, try again" : (j.error || "Failed"));
    } catch { setMsg("Signing cancelled or failed"); }
    setBusy(false);
  }

  // Price and availability always come from the server: /api/quote re-checks both, and /api/register re-checks on-chain ownership.
  async function quote() {
    if (!sel) return;
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain: name, tlds: sel.tld }) });
      const j = await r.json();
      if (!r.ok || j.error) setMsg(j.error === "registration_closed" ? "Registration is not open yet" : (j.error || "Quote unavailable"));
      else if (j.available === false) setMsg(`Not available: ${j.reason ?? ""}`);
      else setMintQuote(j); // MintModal pays exactly the server quote: pay_to and price_sol come from /api/quote, never from this page
    } catch { setMsg("Quote unavailable"); }
    setBusy(false);
  }

  const counts = rows ? { available: rows.filter((r) => r.status === "available").length, owned: rows.filter((r) => r.status === "owned").length, reserved: rows.filter((r) => r.status === "reserved").length } : null;

  return (
    <div className="mx-auto mt-6 max-w-5xl">
      <div className="flex justify-center"><WalletMultiButton /></div>
      {!rows && (
        <div className="mt-4 text-center">
          <button disabled={!publicKey || busy} onClick={load} style={{ background: "#ca8a04", color: "#000", padding: "12px 24px", fontWeight: 700 }}>
            {busy ? "Checking..." : `Sign in as owner of ${name}.teos`}
          </button>
        </div>
      )}
      {notOwner && <p className="mt-4 text-center">This wallet does not hold {name}.teos. {avail}</p>}
      {msg && <p className="mt-3 text-center">{msg}</p>}
      {rows && counts && (
        <>
          <p className="mt-4 text-center">{rows.length} TLDs for {name}: {counts.available} available, {counts.owned} owned, {counts.reserved} reserved</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10, marginTop: 16 }}>
            {rows.map((r) => (
              <button key={r.tld} disabled={r.status !== "available"} onClick={() => setSel(r)} aria-pressed={sel?.tld === r.tld}
                style={{ background: sel?.tld === r.tld ? "#ca8a04" : "#222", color: sel?.tld === r.tld ? "#000" : "#fff", padding: 12, border: `1px solid ${COLOR[r.status]}`, opacity: r.status === "available" ? 1 : 0.55, cursor: r.status === "available" ? "pointer" : "default", textAlign: "left" }}>
                {r.flag} {r.domain}<br />${r.price_usd} - <span style={{ color: sel?.tld === r.tld ? "#000" : COLOR[r.status] }}>{r.status}</span>
              </button>
            ))}
          </div>
          <button disabled={!sel || busy} onClick={quote} style={{ background: "#ca8a04", color: "#000", padding: 15, width: "100%", marginTop: 20, fontSize: 18, fontWeight: 700 }}>
            {sel ? `Buy ${sel.domain} - $${sel.price_usd}` : "Select an available name"}
          </button>
        </>
      )}
      {mintQuote && <MintModal t={L} rtl={rtl} domain={name} quote={mintQuote} onClose={() => setMintQuote(null)} helpHref={SOCIAL.help} />}
    </div>
  );
}
