"use client";
import { useState } from "react";

declare global { interface Window { solana?: any; phantom?: { solana?: any } } }

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...Array.from(u)));
const box: React.CSSProperties = { border: "1px solid #444", borderRadius: 8, padding: 12, margin: "12px 0" };

export default function TestRegister() {
  const [domain, setDomain] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [pubkey, setPubkey] = useState("");
  const [sig, setSig] = useState("");
  const [tx, setTx] = useState("");
  const [out, setOut] = useState("");
  const phantom = () => (typeof window !== "undefined" ? window.phantom?.solana ?? window.solana : undefined);

  async function getQuote() {
    const r = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain }) });
    const j = await r.json();
    setQuote(j.quote_id ? j : null);
    setOut(`${r.status} ${JSON.stringify(j, null, 2)}`);
  }
  async function signIt() {
    const p = phantom();
    if (!p) return setOut("Phantom not found");
    const { publicKey } = await p.connect();
    const { signature } = await p.signMessage(new TextEncoder().encode(quote.message_to_sign), "utf8");
    setPubkey(publicKey.toString());
    setSig(b64(signature));
  }
  async function register() {
    const r = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain, quote_id: quote.quote_id, signature: sig, publicKey: pubkey, payment_tx: tx.trim() }),
    });
    setOut(`${r.status} ${await r.text()}`);
  }

  return (
    <main style={{ maxWidth: 640, margin: "24px auto", padding: 16, fontFamily: "sans-serif" }}>
      <meta name="robots" content="noindex" />
      <h1>TEOS register test</h1>
      <div style={box}>
        <b>1. Quote</b>
        <div><input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="throwaway-name" />{" "}
          <button onClick={getQuote}>Get quote</button></div>
        {quote && <p>Price {quote.price_sol} SOL. Quote expires in 5 minutes.</p>}
      </div>
      <div style={box}>
        <b>2. Sign with Phantom</b>
        <div><button disabled={!quote} onClick={signIt}>Connect and sign</button></div>
        {pubkey && <p style={{ wordBreak: "break-all" }}>Wallet: {pubkey}</p>}
      </div>
      <div style={box}>
        <b>3. Pay</b>
        <p>From the SAME wallet, send {quote?.price_sol ?? "0.05"} SOL to:</p>
        <p style={{ wordBreak: "break-all" }}><code>{quote?.pay_to ?? "(get a quote first)"}</code></p>
        <input style={{ width: "100%" }} value={tx} onChange={(e) => setTx(e.target.value)} placeholder="paste transaction signature" />
      </div>
      <div style={box}>
        <b>4. Register</b>
        <div><button disabled={!sig || !tx} onClick={register}>Register</button></div>
      </div>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{out}</pre>
    </main>
  );
}
