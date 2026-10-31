"use client";
import { useEffect, useState } from "react";
import FounderSeal from "../components/FounderSeal";
import FoundersBanner from "../components/FoundersBanner";
import DomainSearchPopup, { localeCountry } from "../components/DomainSearchPopup";
import CountryDropdown from "../components/CountryDropdown";
import AymanContact from "../components/AymanContact";
import { DICTS, LANGS, type Lang } from "../lib/i18n";

declare global { interface Window { solana?: any; phantom?: { solana?: any } } }

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...Array.from(u)));
const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const card: React.CSSProperties = { background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #3d352a", borderRadius: 4, padding: 20, margin: "16px 0", boxShadow: "inset 0 2px 12px rgba(0,0,0,.6)" };
const btn: React.CSSProperties = { background: "linear-gradient(90deg,#b45309,#ca8a04)", color: "#000", border: "2px solid #713f12", borderRadius: 4, padding: "10px 18px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,.5)" };
const tablet: React.CSSProperties = { background: "#292321", color: "#d6cbb5", border: "1px solid #57493a", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 14 };
const input: React.CSSProperties = { background: "#c9b896", color: "#2a2520", border: "1px solid #8a7550", borderInline: "8px double #7a6540", borderRadius: 0, padding: "10px 12px", fontSize: 16, width: "100%", boxSizing: "border-box" };

type Step = "search" | "sign" | "pay" | "done";

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [name, setName] = useState("");
  const [checked, setChecked] = useState<any>(null); // /api/check response
  const [picked, setPicked] = useState<string[]>(["teos"]);
  const [quote, setQuote] = useState<any>(null);
  const [pubkey, setPubkey] = useState("");
  const [sig, setSig] = useState("");
  const [tx, setTx] = useState("");
  const [step, setStep] = useState<Step>("search");
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [popup, setPopup] = useState(false);
  const [owned, setOwned] = useState<string[]>([]); // names whose .teos was registered in this browser (UI hint only)
  useEffect(() => { try { setOwned(JSON.parse(localStorage.getItem("teosOwned") || "[]")); } catch {} }, []);
  const [lang, setLang] = useState<Lang>("ar");
  const [selectedTld, setSelectedTld] = useState("eg");
  const L = DICTS[lang];
  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    const guess = saved ?? "ar";
    const lc = localeCountry(); if (lc) setSelectedTld(lc);
    if (guess in DICTS) setLang(guess as Lang);
  }, []);
  const pickLang = (l: Lang) => { setLang(l); localStorage.setItem("lang", l); };

  useEffect(() => { fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {}); }, []);
  const open = stats?.registration_open === true && stats?.mint_ready !== false;
  const phantom = () => (typeof window !== "undefined" ? window.phantom?.solana ?? window.solana : undefined);
  const clean = name.trim().toLowerCase().replace(/\.[a-z]{2,6}$/, "");
  const tldInfo = (t: string) => stats?.tlds?.find((x: any) => x.tld === t);
  const res = (t: string) => checked?.results?.find((x: any) => x.tld === t);
  const total = picked.reduce((n, t) => n + (res(t)?.price_usd ?? 0), 0);
  const totalSol = checked?.sol_usd ? total / checked.sol_usd : null;

  async function run(fn: () => Promise<void>) {
    setBusy(true); setMsg("");
    try { await fn(); } catch (e: any) { setMsg(e?.message || "Something went wrong"); } finally { setBusy(false); }
  }

  const check = () => run(async () => {
    setChecked(null); setQuote(null); setStep("search"); setPopup(true);
    const r = await fetch(`/api/check?name=${encodeURIComponent(clean)}&tlds=teos`);
    const j = await r.json();
    if (!r.ok) { setPopup(false); throw new Error(j.error || "Invalid name"); }
    setChecked(j);
    if (!stats?.tlds) setStats(await fetch("/api/stats", { cache: "no-store" }).then((x) => x.json()).catch(() => stats));
  });

  const mint = (tlds: string[]) => run(async () => {
    const q = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain: clean, tlds }) });
    const qj = await q.json();
    if (!q.ok) throw new Error(qj.error || "Could not get a price");
    if (qj.available === false) throw new Error(`.${qj.tld} is ${qj.reason}`);
    setQuote(qj); setStep("sign"); setPopup(false);
    setTimeout(() => document.getElementById("pay")?.scrollIntoView({ behavior: "smooth" }), 50);
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
    if (!r.ok) throw new Error(j.message || (j.error ? `Registration failed: ${j.error}` : `Registration failed (${r.status})`));
    setResult(j); setStep("done");
    if ((quote.tlds ?? ["teos"]).includes("teos")) {
      const next = Array.from(new Set([...owned, clean]));
      setOwned(next); localStorage.setItem("teosOwned", JSON.stringify(next));
    }
  });

  const all: any[] = stats?.tlds ?? [];
  const [wallet, setWallet] = useState("");
  const connectWallet = () => run(async () => {
    const p = phantom();
    if (!p) throw new Error("Install the Phantom wallet to continue.");
    const { publicKey } = await p.connect();
    setWallet(publicKey.toString());
  });

  return (
    <>
    <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(10,8,6,.94)", backdropFilter: "blur(8px)", borderBottom: "1px solid #3d352a" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><FounderSeal size={48} /><div><div style={{ fontFamily: SERIF, fontSize: 24, letterSpacing: "0.3em", color: "#fef3c7", lineHeight: 1 }}>SOVEREIGN</div><div style={{ fontSize: 10, letterSpacing: "0.25em", color: "#a89a80", marginTop: 4 }}>WEB3 DOMAIN MARKETPLACE</div></div></div>
        <span style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <a href="#search" style={{ ...tablet, textDecoration: "none" }}>{L.search}</a>
          <button style={{ ...btn, padding: "4px 14px", fontSize: 14 }} disabled={busy} onClick={connectWallet}>{wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : "Connect Wallet"}</button>
          <span style={{ ...tablet, cursor: "default", fontFamily: "ui-monospace, monospace" }}>{all.length || "..."} TLDs</span>
        </span>
      </div>
    </nav>
    <main dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {LANGS.map((l) => <button key={l.code} onClick={() => pickLang(l.code)} style={{ ...tablet, background: lang === l.code ? "#713f12" : "#292321", color: lang === l.code ? "#fef3c7" : "#d6cbb5" }}>{l.label}</button>)}
      </div>
      <h1 style={{ fontFamily: SERIF, fontSize: 14, margin: "0 0 12px", color: "#a89a80", letterSpacing: "0.3em" }}>TEOS</h1>
      <FoundersBanner />
      <p style={{ fontSize: 20, color: "#a89a80" }}>{L.intro} <b>.teos</b> {L.intro2}</p>

      {stats && !open && (
        <div style={{ ...card, borderColor: "#b8860b" }}>
          <b>{stats.registration_open === true ? L.paused : L.soon}</b> {L.checkNow}
        </div>
      )}

      <style>{`.tlds{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:10px}@media(min-width:640px){.tlds{grid-template-columns:repeat(4,1fr)}}@media(min-width:960px){.tlds{grid-template-columns:repeat(6,1fr)}}`}</style>
      <div id="search" style={{ ...card, position: "relative", overflow: "hidden", padding: "28px 20px" }}>
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "repeating-linear-gradient(0deg,#6b5a3e 0 1px,transparent 1px 38px),repeating-linear-gradient(90deg,#6b5a3e 0 1px,transparent 1px 64px),radial-gradient(circle at 30% 20%,#8a7550,transparent 60%)" }} />
        <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "center" }}>
          <svg aria-hidden="true" viewBox="0 0 400 400" width="100%" style={{ maxWidth: 300, height: "auto", filter: "drop-shadow(0 0 22px rgba(234,179,8,.55))" }}>
            <g fill="none" stroke="#eab308" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="200" cy="105" rx="52" ry="68" />
              <path d="M200 173V350M130 215H270" />
              <path d="M150 300c0 40 100 40 100 0M130 280l20 20M270 280l-20 20" strokeWidth="10" />
            </g>
            <circle cx="200" cy="105" r="14" fill="#7f1d1d" stroke="#eab308" strokeWidth="4" />
          </svg>
          <div style={{ flex: "1 1 360px", textAlign: "center", minWidth: 0 }}>
            <label htmlFor="n" style={{ display: "block", marginBottom: 10, fontFamily: SERIF, letterSpacing: "0.1em", fontSize: 18 }}>{L.find}</label>
            <input id="n" dir="auto" style={{ ...input, fontSize: 21, padding: "16px 14px", textAlign: "center" }} value={name} placeholder={L.sonPlaceholder} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && clean && check()} />
            <div style={{ margin: "12px 0" }}>
              <CountryDropdown tlds={all} selected={selectedTld} onSelect={setSelectedTld} placeholder={L.country} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, textAlign: "center" }}>
              <div style={{ flex: "1 1 200px", background: "#d4c5a9", color: "#2a2520", border: "3px double #7a6540", padding: 12, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "center" }}><FounderSeal size={56} /></div>
                <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, overflowWrap: "anywhere" }}>{clean || "name"}.teos</div>
                <div dir="auto" style={{ fontSize: 12, color: "#7f1d1d", fontWeight: 700 }}>{L.sovereignKey}</div>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 18 }}>${tldInfo("teos")?.promo_usd ?? 10}</div>
              </div>
              <div style={{ flex: "1 1 200px", background: "#2a2520", border: "1px solid #57493a", padding: 12, minWidth: 0, opacity: owned.includes(clean) ? 1 : 0.85 }}>
                <div style={{ fontSize: 28 }}>{owned.includes(clean) ? "🔓" : "🔒"}</div>
                <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, overflowWrap: "anywhere" }}>{clean || "name"}.{selectedTld}</div>
                <div dir="auto" style={{ fontSize: 12, color: owned.includes(clean) ? "#4ade80" : "#f87171", fontWeight: 700 }}>{owned.includes(clean) ? "" : `${L.locked} - ${L.needsTeos}`}</div>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 18 }}>${tldInfo(selectedTld)?.promo_usd ?? 10}</div>
              </div>
            </div>
            <p style={{ margin: "16px 0 0" }}>
              <button style={{ ...btn, fontSize: 18, padding: "14px 28px" }} disabled={busy || !clean} onClick={check}>{L.checkBtn}</button>
            </p>
            <p style={{ margin: "12px 0 0", color: "#a89a80", fontSize: 13, letterSpacing: "0.06em" }}>{all.length ? `${all.length} sovereign TLDs` : "Sovereign TLDs"} • Dig Site 022 Alexandria • Rule: TEOS Root Required</p>
          </div>
        </div>
      </div>

      {popup && (
        <DomainSearchPopup
          name={clean}
          teos={checked ? checked.results?.find((x: any) => x.tld === "teos") ?? null : null}
          tlds={all}
          ownsTeos={owned.includes(clean)}
          founder={clean === "elmahrosa"}
          open={open}
          busy={busy}
          onBuy={mint}
          onClose={() => setPopup(false)}
        />
      )}

      <div style={card}>
        <b>{L.pricing}</b>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#a89a80" }}><th style={{ padding: 6 }}>{L.length}</th><th style={{ padding: 6 }}>{L.first} {stats?.promo_limit ?? 100} {L.perTld}</th><th style={{ padding: 6 }}>{L.after}</th></tr>
          </thead>
          <tbody>
            {[
              [L.l5, `$${stats?.promo_usd ?? 10}`, `$${stats?.market_usd?.long ?? 30}`],
              [L.l4, L.market, `$${stats?.market_usd?.four ?? 150}`],
              [L.l3, L.market, `$${stats?.market_usd?.short ?? 400}`],
            ].map(([a, b, c]) => (
              <tr key={a} style={{ borderTop: "1px solid #3d352a" }}>
                <td style={{ padding: 6 }}>{a}</td>
                <td style={{ padding: 6 }}>{b}{b.startsWith("$") && stats?.sol_usd ? ` (~${(Number(b.slice(1)) / stats.sol_usd).toFixed(3)} SOL)` : ""}</td>
                <td style={{ padding: 6 }}>{c}{c.startsWith("$") && stats?.sol_usd ? ` (~${(Number(c.slice(1)) / stats.sol_usd).toFixed(2)} SOL)` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginBottom: 0, color: "#a89a80", fontSize: 13 }}>{L.payNote}</p>
      </div>

      {open && quote && step !== "done" && (
        <div id="pay" style={card}>
          <h2 style={{ marginTop: 0 }}>Buy {(quote.tlds ?? ["teos"]).map((t: string) => `${clean}.${t}`).join(", ")} for {quote.price_sol} SOL{quote.price_usd ? ` ($${quote.price_usd})` : ""}</h2>
          <p><b>1. Prove it is your wallet.</b> Phantom asks you to sign a message. This costs nothing.</p>
          <button style={btn} disabled={busy || step !== "sign"} onClick={sign}>{pubkey ? "Signed" : "Connect Phantom and sign"}</button>
          {pubkey && <p style={{ wordBreak: "break-all", color: "#a89a80" }}>Wallet: {pubkey}</p>}
          {step === "pay" && (
            <>
              <p><b>2. Pay.</b> From the same wallet, send exactly {quote.price_sol} SOL to:</p>
              <code style={{ wordBreak: "break-all", display: "block", background: "#0a0806", padding: 10, borderRadius: 8 }}>{quote.pay_to}</code>
              <p><b>3. Paste the transaction signature</b> and register within 5 minutes of the quote.</p>
              <input style={input} value={tx} placeholder="transaction signature" onChange={(e) => setTx(e.target.value)} />
              <p><button style={btn} disabled={busy || !tx.trim()} onClick={register}>Register</button></p>
            </>
          )}
        </div>
      )}

      {step === "done" && result && (
        <div style={{ ...card, borderColor: "#4ade80" }}>
          <h2 style={{ marginTop: 0 }}>{result.items ? result.items.map((i: any) => i.domain).join(", ") : `${clean}.teos`} registered</h2>
          {result.pending_mint
            ? <p>Your payment and name are recorded. The asset is not minted yet, so save this page and contact support with your transaction signature.</p>
            : <p>The asset was minted to your wallet.</p>}
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#a89a80" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {msg && <p role="alert" style={{ color: "#f87171" }}>{msg}</p>}

      <div style={card}>
        <b>{L.founders}</b>
        <p style={{ marginBottom: 0, color: "#a89a80" }}>{L.foundersText}{" "}
          {stats?.mints?.map((m: string) => <a key={m} style={{ color: "#eab308", marginRight: 10 }} href={`https://core.metaplex.com/explorer/${m}?env=mainnet`}>{L.view}</a>)}</p>
      </div>
      <div style={{ background: "#d4c5a9", color: "#2a2520", border: "4px double #7a6540", padding: "24px 16px", textAlign: "center", margin: "16px 0" }}>
        <div style={{ display: "flex", justifyContent: "center" }}><FounderSeal size={72} /></div>
        <h2 dir="auto" style={{ fontFamily: SERIF, margin: "10px 0 4px" }}>{L.certTitle} - Dig Certificate</h2>
        <p dir="auto" style={{ margin: 0 }}>{L.certText}</p>
      </div>
      <footer style={{ ...card, textAlign: "center", color: "#a89a80", fontSize: 14 }}>
        Founder TEOS - Alexandria Egypt - WhatsApp: <a style={{ color: "#25D366" }} href="https://wa.me/201006167293" target="_blank" rel="noopener noreferrer">01006167293</a>
      </footer>
      <AymanContact lang={lang} />
    </main>
    </>
  );
}
