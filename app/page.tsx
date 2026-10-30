"use client";
import { useEffect, useState } from "react";

declare global { interface Window { solana?: any; phantom?: { solana?: any } } }

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...Array.from(u)));
const card: React.CSSProperties = { background: "#151923", border: "1px solid #262c3b", borderRadius: 12, padding: 20, margin: "16px 0" };
const btn: React.CSSProperties = { background: "#7c5cff", color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", fontSize: 16, cursor: "pointer" };
const input: React.CSSProperties = { background: "#0b0d12", color: "#e8eaf0", border: "1px solid #333a4d", borderRadius: 8, padding: "10px 12px", fontSize: 16, width: "100%", boxSizing: "border-box" };

type Step = "search" | "sign" | "pay" | "done";

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [name, setName] = useState("");
  const [avail, setAvail] = useState<any>(null);
  const [quote, setQuote] = useState<any>(null);
  const [pubkey, setPubkey] = useState("");
  const [sig, setSig] = useState("");
  const [tx, setTx] = useState("");
  const [step, setStep] = useState<Step>("search");
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {}); }, []);
  const open = stats?.registration_open === true;
  const phantom = () => (typeof window !== "undefined" ? window.phantom?.solana ?? window.solana : undefined);
  const clean = name.trim().toLowerCase().replace(/\.teos$/, "");

  async function run(fn: () => Promise<void>) {
    setBusy(true); setMsg("");
    try { await fn(); } catch (e: any) { setMsg(e?.message || "Something went wrong"); } finally { setBusy(false); }
  }

  const check = () => run(async () => {
    setAvail(null); setQuote(null); setStep("search");
    const r = await fetch(`/api/availability?domain=${encodeURIComponent(clean)}`);
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Invalid name");
    setAvail(j);
    // Re-read the live state so a page opened before registration opened still works.
    const st = await fetch("/api/stats", { cache: "no-store" }).then((x) => x.json()).catch(() => stats);
    setStats(st);
    if (j.available && st?.registration_open === true) {
      const q = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain: clean }) });
      const qj = await q.json();
      if (!q.ok) throw new Error(qj.error || "Could not get a price");
      setQuote(qj); setStep("sign");
    }
  });

  const sign = () => run(async () => {
    const p = phantom();
    if (!p) {
      // Phone browsers do not inject a wallet. Phantom's deep link reopens this page inside the Phantom app's own browser.
      if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        window.location.href = `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}?ref=${encodeURIComponent(window.location.origin)}`;
        return;
      }
      throw new Error("Install the Phantom wallet to continue.");
    }
    const { publicKey } = await p.connect();
    const { signature } = await p.signMessage(new TextEncoder().encode(quote.message_to_sign), "utf8");
    setPubkey(publicKey.toString()); setSig(b64(signature)); setStep("pay");
  });

  const register = () => run(async () => {
    const r = await fetch("/api/register", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain: clean, quote_id: quote.quote_id, signature: sig, publicKey: pubkey, payment_tx: tx.trim() }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error ? `Registration failed: ${j.error}` : `Registration failed (${r.status})`);
    setResult(j); setStep("done");
  });

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 44, margin: 0 }}>TEOS</h1>
      <p style={{ fontSize: 20, color: "#a9b0c3" }}>Your name on Solana. Register a <b>.teos</b> name as a Metaplex Core asset that you own in your own wallet.</p>

      {stats?.total_minted !== undefined && stats.remaining > 0 && (
        <div style={{ background: "#facc15", color: "black", padding: 12, textAlign: "center", fontWeight: "bold", margin: "0 -20px 24px" }}>
          EARLY BIRD: {stats.total_minted}/100 Minted - {stats.remaining} LEFT AT $5{stats.early_bird_price_sol ? ` (~${Number(stats.early_bird_price_sol).toFixed(3)} SOL)` : ""}
        </div>
      )}

      <div style={card}>
        <label htmlFor="n" style={{ display: "block", marginBottom: 8 }}>Find your name</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input id="n" style={input} value={name} placeholder="yourname" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && clean && check()} />
          <button style={btn} disabled={busy || !clean} onClick={check}>Search</button>
        </div>
        {avail && (
          <p style={{ marginBottom: 0 }}>
            <b>{clean}.teos</b> is {avail.available ? <span style={{ color: "#4ade80" }}>available</span> : <span style={{ color: "#f87171" }}>TAKEN{avail.reason === "reserved" ? " (reserved)" : ""}</span>}.
          </p>
        )}
      </div>

      <div style={card}>
        <b>Pricing</b>
        <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
          <tbody>
            <tr><td>Now (first 100)</td><td>5+ letters = $5</td></tr>
            <tr><td rowSpan={3} style={{ verticalAlign: "top" }}>After 100</td><td>5+ letters = 0.2 SOL</td></tr>
            <tr><td>4 letters = 1.0 SOL</td></tr>
            <tr><td>3 letters = 2.5 SOL</td></tr>
          </tbody>
        </table>
      </div>

      {open && quote && step !== "done" && (
        <div style={card}>
          <h2 style={{ marginTop: 0 }}>Buy {clean}.teos for {quote.price_sol} SOL{quote.price_sol < 0.5 && avail?.early_bird ? " ($5)" : ""}</h2>
          <p><b>1. Prove it is your wallet.</b> Phantom asks you to sign a message. This costs nothing.</p>
          <button style={btn} disabled={busy || step !== "sign"} onClick={sign}>{pubkey ? "Signed" : "Connect Phantom and sign"}</button>
          {pubkey && <p style={{ wordBreak: "break-all", color: "#a9b0c3" }}>Wallet: {pubkey}</p>}
          {step === "pay" && (
            <>
              <p><b>2. Pay.</b> From the same wallet, send exactly {quote.price_sol} SOL to:</p>
              <code style={{ wordBreak: "break-all", display: "block", background: "#0b0d12", padding: 10, borderRadius: 8 }}>{quote.pay_to}</code>
              <p><b>3. Paste the transaction signature</b> and register within 5 minutes of the quote.</p>
              <input style={input} value={tx} placeholder="transaction signature" onChange={(e) => setTx(e.target.value)} />
              <p><button style={btn} disabled={busy || !tx.trim()} onClick={register}>Register {clean}.teos</button></p>
            </>
          )}
        </div>
      )}

      {step === "done" && result && (
        <div style={{ ...card, borderColor: "#4ade80" }}>
          <h2 style={{ marginTop: 0 }}>{clean}.teos is yours</h2>
          {result.pending_mint
            ? <p>Your payment and name are recorded. The asset is not minted yet, so save this page and contact support with your transaction signature.</p>
            : <p>The asset was minted to your wallet.</p>}
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#a9b0c3" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {msg && <p role="alert" style={{ color: "#f87171" }}>{msg}</p>}

      <div style={card}>
        <b>Founders</b>
        <p style={{ marginBottom: 0, color: "#a9b0c3" }}>AYMAN.TEOS and ELMAHROSA.TEOS are minted on Solana mainnet.{" "}
          {stats?.mints?.map((m: string) => <a key={m} style={{ color: "#9d86ff", marginRight: 10 }} href={`https://core.metaplex.com/explorer/${m}?env=mainnet`}>view</a>)}</p>
      </div>
    </main>
  );
}
