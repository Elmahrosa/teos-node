"use client";
import { useEffect, useState } from "react";
import { DICTS, LANGS, type Lang } from "../lib/i18n";

declare global { interface Window { solana?: any; phantom?: { solana?: any } } }

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...Array.from(u)));
const card: React.CSSProperties = { background: "#151923", border: "1px solid #262c3b", borderRadius: 12, padding: 20, margin: "16px 0" };
const btn: React.CSSProperties = { background: "#7c5cff", color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", fontSize: 16, cursor: "pointer" };
const input: React.CSSProperties = { background: "#0b0d12", color: "#e8eaf0", border: "1px solid #333a4d", borderRadius: 8, padding: "10px 12px", fontSize: 16, width: "100%", boxSizing: "border-box" };

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
  const [lang, setLang] = useState<Lang>("en");
  const L = DICTS[lang];
  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    const guess = saved ?? (navigator.language.startsWith("ar") ? "ar" : navigator.language.startsWith("id") ? "id" : "en");
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
    setChecked(null); setQuote(null); setStep("search");
    const r = await fetch(`/api/check?name=${encodeURIComponent(clean)}`);
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Invalid name");
    setChecked(j);
    const st = await fetch("/api/stats", { cache: "no-store" }).then((x) => x.json()).catch(() => stats);
    setStats(st);
    // .teos is required and pre-selected whenever it is available.
    setPicked(j.results.find((x: any) => x.tld === "teos" && x.available) ? ["teos"] : []);
  });

  const toggle = (t: string) => {
    if (t === "teos" && res("teos")?.available) return; // required
    setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  };

  const mint = () => run(async () => {
    const q = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain: clean, tlds: picked }) });
    const qj = await q.json();
    if (!q.ok) throw new Error(qj.error || "Could not get a price");
    if (qj.available === false) throw new Error(`.${qj.tld} is ${qj.reason}`);
    setQuote(qj); setStep("sign");
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
  });

  const ARAB = ["sa","ae","qa","kw","bh","om","eg","jo","lb","sy","iq","ye","ps","ma","dz","tn","ly","sd","so","dj","km","mr"];
  const AFRICA_REGIONS = ["North Africa","West Africa","Central Africa","East Africa","Southern Africa","Indian Ocean","Horn"];
  const META = ["mena","africa"];
  const all: any[] = stats?.tlds ?? [];
  const by = (codes: string[]) => codes.map((c) => all.find((t) => t.tld === c)).filter(Boolean);
  const africa = all.filter((t) => AFRICA_REGIONS.includes(t.region));
  const world = all.filter((t) => t.tld !== "teos" && !META.includes(t.tld) && !ARAB.includes(t.tld) && !AFRICA_REGIONS.includes(t.region));
  const sections = [
    { key: "arab", title: "🇸🇦 ALL ARAB", sub: "Arab nations", items: by(ARAB) },
    { key: "africa", title: "🌍 AFRICA", sub: "Africa, all regions", items: africa },
    { key: "world", title: "🌐 WORLD POWERS", sub: "Europe | USA RU CN | Asia | Americas | Oceania", items: world },
    { key: "meta", title: "🔱 META ROOTS", sub: ".mena and .africa sit under the .teos root", items: by(META) },
  ];
  const [wallet, setWallet] = useState("");
  const connectWallet = () => run(async () => {
    const p = phantom();
    if (!p) throw new Error("Install the Phantom wallet to continue.");
    const { publicKey } = await p.connect();
    setWallet(publicKey.toString());
  });

  const Flag = ({ t, size }: { t: any; size: number }) => {
    const base: React.CSSProperties = { width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden" };
    if (t.tld === "teos") return <span style={{ ...base, background: "radial-gradient(circle at 30% 30%, #ffe08a, #b8860b)", border: "2px solid #ffd700", fontSize: size * 0.55 }} title="TEOS">🔱</span>;
    if (t.tld.length === 2) return <img src={`https://flagcdn.com/w80/${t.tld}.png`} alt={t.name ?? t.tld} width={size} height={size} style={{ ...base, objectFit: "cover", border: "1px solid #333a4d" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />;
    return <span style={{ ...base, background: "#1b1f2e", border: "1px solid #333a4d", fontSize: size * 0.55 }}>{t.flag}</span>;
  };

  const tldCard = (t: any, king: boolean, group = "") => {
    const r = res(t.tld);
    const required = t.tld === "teos" && r?.available;
    const on = picked.includes(t.tld);
    const usable = t.live && (!checked || r?.available);
    return (
      <label key={`${group}-${t.tld}`} style={{ display: "block", border: king ? "2px solid #ffd700" : `1px solid ${on ? "#7c5cff" : "#262c3b"}`, boxShadow: king ? "0 0 40px rgba(255,215,0,.35)" : undefined, borderRadius: king ? 20 : 10, padding: king ? 28 : 10, opacity: t.live ? 1 : 0.45, cursor: usable && !required ? "pointer" : "default", background: king ? "linear-gradient(160deg,#241c06,#151923)" : on ? "#1b1f2e" : "transparent", textAlign: king ? "center" : undefined }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: king ? "center" : undefined, flexDirection: king ? "column" : undefined }}>
          <Flag t={t} size={king ? 96 : 28} />
          <div>
            <b dir="ltr" style={{ fontSize: king ? 44 : undefined, color: king ? "#ffd700" : undefined }}>{t.label}</b>
            {t.name && <div style={{ color: "#a9b0c3", fontSize: king ? 15 : 12 }}>{t.name}</div>}
          </div>
          <input type="checkbox" style={{ marginInlineStart: king ? 0 : "auto" }} checked={on} disabled={!usable || !checked || required || step !== "search"} onChange={() => toggle(t.tld)} />
        </div>
        <div style={{ color: king ? "#ffe08a" : "#a9b0c3", fontSize: king ? 18 : 13, marginTop: 6 }}>{t.sold ?? "-"}/{t.promo_limit}{king ? " GENESIS" : ""} - ${t.promo_usd}</div>
        <div style={{ fontSize: 13 }}>
          {!t.live ? <span style={{ color: "#a9b0c3" }}>soon</span> : !checked ? "" : r?.available ? <span style={{ color: "#4ade80" }}>✅ {L.available}{required ? ` (${L.required})` : ""}</span> : <span style={{ color: "#f87171" }}>❌ {r?.reason ?? L.taken}</span>}
        </div>
      </label>
    );
  };
  const king = all.find((t) => t.tld === "teos");

  return (
    <>
    <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(11,13,18,.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid #262c3b" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <b style={{ fontSize: 22, color: "#ffd700" }}>🔱 TEOS</b>
        <span style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <a href="#search" style={{ color: "#e8eaf0", textDecoration: "none" }}>{L.search}</a>
          <button style={{ ...btn, padding: "6px 14px", fontSize: 14 }} disabled={busy} onClick={connectWallet}>{wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : "Connect Wallet"}</button>
          <span style={{ color: "#a9b0c3", fontSize: 14 }}>{all.length || "..."} TLDs</span>
        </span>
      </div>
    </nav>
    <main dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {LANGS.map((l) => <button key={l.code} onClick={() => pickLang(l.code)} style={{ background: lang === l.code ? "#7c5cff" : "transparent", color: "#e8eaf0", border: "1px solid #333a4d", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>{l.label}</button>)}
      </div>
      <h1 style={{ fontSize: 14, margin: 0, color: "#a9b0c3", letterSpacing: 3 }}>TEOS</h1>
      {king && <div style={{ maxWidth: 420, margin: "16px auto" }}>
        <div style={{ textAlign: "center", color: "#ffd700", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>KING TEOS - Sovereign Root</div>
        {tldCard(king, true, "hero")}
      </div>}
      <p style={{ fontSize: 20, color: "#a9b0c3" }}>{L.intro} <b>.teos</b> {L.intro2}</p>

      {stats && !open && (
        <div style={{ ...card, borderColor: "#b8860b" }}>
          <b>{stats.registration_open === true ? L.paused : L.soon}</b> {L.checkNow}
        </div>
      )}

      <style>{`.tlds{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:10px}@media(min-width:640px){.tlds{grid-template-columns:repeat(4,1fr)}}@media(min-width:960px){.tlds{grid-template-columns:repeat(6,1fr)}}.wa{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.5);z-index:50;transition:transform .15s}.wa:hover{transform:scale(1.1)}`}</style>
      <div id="search" style={card}>
        <label htmlFor="n" style={{ display: "block", marginBottom: 8 }}>{L.find}</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input id="n" dir="auto" style={input} value={name} placeholder={L.placeholder} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && clean && check()} />
          <button style={btn} disabled={busy || !clean} onClick={check}>{L.search}</button>
        </div>
        {sections.map((sec) => sec.items.length > 0 && (
          <section key={sec.key} style={{ marginTop: 22 }}>
            <h2 style={{ fontSize: 20, margin: 0 }}>{sec.title} <span style={{ color: "#a9b0c3", fontSize: 14, fontWeight: 400 }}>({sec.items.length})</span></h2>
            {sec.sub && <div style={{ color: "#a9b0c3", fontSize: 13 }}>{sec.sub}</div>}
            <div className="tlds">{sec.items.map((t: any) => tldCard(t, false, sec.key))}</div>
          </section>
        ))}
        {checked && picked.length > 0 && step === "search" && (
          <p style={{ marginBottom: 0 }}>
            <button style={btn} disabled={busy || !open} onClick={mint}>
              {L.mint} ({L.total} ${total}{totalSol ? ` ~ ${totalSol.toFixed(3)} SOL` : ""})
            </button>
            {!open && <span style={{ color: "#a9b0c3", marginLeft: 10 }}>{stats?.registration_open === true ? L.paused : L.soon}</span>}
          </p>
        )}
        {checked && !res("teos")?.available && <p style={{ color: "#a9b0c3", marginBottom: 0 }}>{clean}.teos is not available. Other names under {clean} need you to already own {clean}.teos.</p>}
      </div>

      <div style={card}>
        <b>{L.pricing}</b>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#a9b0c3" }}><th style={{ padding: 6 }}>{L.length}</th><th style={{ padding: 6 }}>{L.first} {stats?.promo_limit ?? 100} {L.perTld}</th><th style={{ padding: 6 }}>{L.after}</th></tr>
          </thead>
          <tbody>
            {[
              [L.l5, `$${stats?.promo_usd ?? 10}`, `$${stats?.market_usd?.long ?? 30}`],
              [L.l4, L.market, `$${stats?.market_usd?.four ?? 150}`],
              [L.l3, L.market, `$${stats?.market_usd?.short ?? 400}`],
            ].map(([a, b, c]) => (
              <tr key={a} style={{ borderTop: "1px solid #262c3b" }}>
                <td style={{ padding: 6 }}>{a}</td>
                <td style={{ padding: 6 }}>{b}{b.startsWith("$") && stats?.sol_usd ? ` (~${(Number(b.slice(1)) / stats.sol_usd).toFixed(3)} SOL)` : ""}</td>
                <td style={{ padding: 6 }}>{c}{c.startsWith("$") && stats?.sol_usd ? ` (~${(Number(c.slice(1)) / stats.sol_usd).toFixed(2)} SOL)` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginBottom: 0, color: "#a9b0c3", fontSize: 13 }}>{L.payNote}</p>
      </div>

      {open && quote && step !== "done" && (
        <div style={card}>
          <h2 style={{ marginTop: 0 }}>Buy {(quote.tlds ?? ["teos"]).map((t: string) => `${clean}.${t}`).join(", ")} for {quote.price_sol} SOL{quote.price_usd ? ` ($${quote.price_usd})` : ""}</h2>
          <p><b>1. Prove it is your wallet.</b> Phantom asks you to sign a message. This costs nothing.</p>
          <button style={btn} disabled={busy || step !== "sign"} onClick={sign}>{pubkey ? "Signed" : "Connect Phantom and sign"}</button>
          {pubkey && <p style={{ wordBreak: "break-all", color: "#a9b0c3" }}>Wallet: {pubkey}</p>}
          {step === "pay" && (
            <>
              <p><b>2. Pay.</b> From the same wallet, send exactly {quote.price_sol} SOL to:</p>
              <code style={{ wordBreak: "break-all", display: "block", background: "#0b0d12", padding: 10, borderRadius: 8 }}>{quote.pay_to}</code>
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
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#a9b0c3" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {msg && <p role="alert" style={{ color: "#f87171" }}>{msg}</p>}

      <div style={card}>
        <b>{L.founders}</b>
        <p style={{ marginBottom: 0, color: "#a9b0c3" }}>{L.foundersText}{" "}
          {stats?.mints?.map((m: string) => <a key={m} style={{ color: "#9d86ff", marginRight: 10 }} href={`https://core.metaplex.com/explorer/${m}?env=mainnet`}>{L.view}</a>)}</p>
      </div>
      <footer style={{ ...card, textAlign: "center", color: "#a9b0c3", fontSize: 14 }}>
        Founder TEOS - Alexandria Egypt - WhatsApp: <a style={{ color: "#25D366" }} href="https://wa.me/201006167293" target="_blank" rel="noopener noreferrer">01006167293</a>
      </footer>
      <a className="wa" href="https://wa.me/201006167293" target="_blank" rel="noopener noreferrer" aria-label="Founder on WhatsApp" title="Founder - 01006167293"><svg viewBox="0 0 24 24" width="30" height="30" fill="#fff" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.300.2-1.400-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.600 15.100L2 22l5-1.300A10 10 0 1 0 12 2zm0 18.200c-1.500 0-3-.4-4.200-1.200l-.3-.2-3 .8.8-2.900-.2-.3A8.200 8.200 0 1 1 12 20.200z"/></svg></a>
    </main>
    </>
  );
}
