"use client";
import { useEffect, useState } from "react";
import FounderSeal from "../components/FounderSeal";
import FoundersBanner from "../components/FoundersBanner";
import DomainSearchPopup, { localeCountry } from "../components/DomainSearchPopup";
import CountryDropdown from "../components/CountryDropdown";
import AymanContact from "../components/AymanContact";
import SiteFooter from "../components/SiteFooter";
import LanguageToggle from "../components/LanguageToggle";
import Divider from "../components/Divider";
import PricingTable from "../components/PricingTable";
import TrustSection from "../components/TrustSection";
import WhyBuy from "../components/WhyBuy";
import MintModal, { type MintQuote } from "../components/MintModal";
import { fmt } from "../lib/i18n";
import { useLang } from "../lib/useLang";
import { SOCIAL } from "../lib/social";

declare global { interface Window { solana?: any; phantom?: { solana?: any } } }

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const card: React.CSSProperties = { background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #3d352a", borderRadius: 4, padding: 20, margin: "16px 0", boxShadow: "inset 0 2px 12px rgba(0,0,0,.6)" };
const btn: React.CSSProperties = { background: "linear-gradient(90deg,#b45309,#ca8a04)", color: "#000", border: "2px solid #713f12", borderRadius: 4, padding: "10px 18px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,.5)" };
const tablet: React.CSSProperties = { background: "#292321", color: "#d6cbb5", border: "1px solid #57493a", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 14 };
const input: React.CSSProperties = { background: "#c9b896", color: "#2a2520", border: "1px solid #8a7550", borderInline: "8px double #7a6540", borderRadius: 0, padding: "10px 12px", fontSize: 16, width: "100%", boxSizing: "border-box" };

export default function Home() {
  const { lang, setLang, L, rtl } = useLang();
  const [stats, setStats] = useState<any>(null);
  const [name, setName] = useState("");
  const [checked, setChecked] = useState<any>(null); // /api/check response
  const [quote, setQuote] = useState<MintQuote | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [popup, setPopup] = useState(false);
  const [owned, setOwned] = useState<string[]>([]); // names whose .teos was registered in this browser (UI hint only)
  const [selectedTld, setSelectedTld] = useState("eg");
  const [wallet, setWallet] = useState("");
  useEffect(() => {
    try { setOwned(JSON.parse(localStorage.getItem("teosOwned") || "[]")); } catch {}
    const lc = localeCountry(); if (lc) setSelectedTld(lc);
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  const open = stats?.registration_open === true && stats?.mint_ready !== false;
  const clean = name.trim().toLowerCase().replace(/\.[a-z]{2,6}$/, "");
  const tldInfo = (t: string) => stats?.tlds?.find((x: any) => x.tld === t);
  const all: any[] = stats?.tlds ?? [];

  async function run(fn: () => Promise<void>) {
    setBusy(true); setMsg("");
    try { await fn(); } catch (e: any) { setMsg(e?.message || "Something went wrong"); } finally { setBusy(false); }
  }

  const check = () => run(async () => {
    setChecked(null); setQuote(null); setPopup(true);
    const r = await fetch(`/api/check?name=${encodeURIComponent(clean)}&tlds=teos`);
    const j = await r.json();
    if (!r.ok) { setPopup(false); throw new Error(j.error || "Invalid name"); }
    setChecked(j);
    if (!stats?.tlds) setStats(await fetch("/api/stats", { cache: "no-store" }).then((x) => x.json()).catch(() => stats));
  });

  // Buying gets a 5 minute quote, then the mint modal handles wallet, payment and registration.
  const mint = (tlds: string[]) => run(async () => {
    const q = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain: clean, tlds }) });
    const qj = await q.json();
    if (!q.ok) throw new Error(qj.error || "Could not get a price");
    if (qj.available === false) throw new Error(`.${qj.tld} is ${qj.reason}`);
    setQuote(qj); setPopup(false);
  });

  const goSearch = () => {
    document.getElementById("search")?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => document.getElementById("n")?.focus(), 400);
  };
  const phantom = () => (typeof window !== "undefined" ? window.phantom?.solana ?? window.solana : undefined);
  const connectWallet = () => run(async () => {
    const p = phantom();
    if (!p) throw new Error(L.installPhantom);
    const { publicKey } = await p.connect();
    setWallet(publicKey.toString());
  });

  const tiers = { promo: stats?.promo_usd ?? 10, long: stats?.market_usd?.long ?? 30, four: stats?.market_usd?.four ?? 150, short: stats?.market_usd?.short ?? 400 };

  return (
    <>
    <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(10,8,6,.94)", backdropFilter: "blur(8px)", borderBottom: "1px solid #3d352a" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><FounderSeal size={48} /><div><div style={{ fontFamily: SERIF, fontSize: 24, letterSpacing: "0.3em", color: "#fef3c7", lineHeight: 1 }}>SOVEREIGN</div><div style={{ fontSize: 10, letterSpacing: "0.25em", color: "#a89a80", marginTop: 4 }}>{L.tagline}</div></div></div>
        <span style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <a href="#search" style={{ ...tablet, textDecoration: "none" }}>{L.search}</a>
          <button style={{ ...btn, padding: "4px 14px", fontSize: 14 }} disabled={busy} onClick={connectWallet}>{wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : L.connect}</button>
          <span style={{ ...tablet, cursor: "default", fontFamily: "ui-monospace, monospace" }}>{all.length || "..."} {L.tldsWord}</span>
        </span>
      </div>
    </nav>
    <main dir={rtl ? "rtl" : "ltr"} lang={lang} style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
      <LanguageToggle lang={lang} onChange={setLang} />

      {/* A. Hero */}
      <header style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <h1 style={{ fontFamily: SERIF, fontSize: "clamp(26px,5vw,44px)", color: "#fef3c7", letterSpacing: "0.08em", margin: "0 0 8px", textShadow: "0 2px 6px rgba(0,0,0,.8)" }}>{L.heroTitle}</h1>
        <p style={{ margin: 0, fontSize: 18, color: "#d6cbb5" }}>{L.heroSub}</p>
      </header>

      {stats && !open && (
        <div style={{ ...card, borderColor: "#b8860b" }}>
          <b>{stats.registration_open === true ? L.paused : L.soon}</b> {L.checkNow}
        </div>
      )}

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
              <CountryDropdown tlds={all} selected={selectedTld} onSelect={setSelectedTld} placeholder={L.country} empty={L.dropdownEmpty} />
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
            <p style={{ margin: "12px 0 0", color: "#a89a80", fontSize: 13, letterSpacing: "0.06em" }}>{all.length ? fmt(L.sovTlds, { n: all.length }) : ""} • {L.rule}</p>
          </div>
        </div>
      </div>

      {popup && (
        <DomainSearchPopup
          t={L}
          rtl={lang === "ar"}
          homeTld={selectedTld}
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

      {quote && <MintModal t={L} rtl={rtl} domain={clean} quote={quote} onClose={() => setQuote(null)} helpHref={SOCIAL.help} />}
      {msg && <p role="alert" style={{ color: "#f87171" }}>{msg}</p>}

      {/* Why buy */}
      <WhyBuy t={L} countries={Math.max(0, all.length - 1)} onCta={goSearch} />

      {/* Pricing */}
      <PricingTable t={L} tiers={tiers} solUsd={stats?.sol_usd ?? null} />

      <Divider />
      {/* B. Offer */}
      <FoundersBanner t={L} rtl={rtl} />

      {/* C. Action */}
      <div style={{ textAlign: "center", margin: "8px 0 8px" }}>
        <button onClick={goSearch} style={{ ...btn, fontSize: 26, padding: "20px 48px", letterSpacing: "0.1em", fontFamily: SERIF, boxShadow: "0 0 30px rgba(202,138,4,.7), 0 6px 14px rgba(0,0,0,.6)" }}>{L.reserve}</button>
        <p style={{ margin: "10px 0 0", color: "#a89a80", fontSize: 14 }}>{L.reserveHint}</p>
        <p style={{ margin: "6px 0 0", fontSize: 13 }}><a style={{ color: "#a89a80" }} href={SOCIAL.help} target="_blank" rel="noopener noreferrer">{L.needHelp}</a></p>
      </div>

      <Divider />
      <TrustSection t={L} founders={stats?.founders ?? []} mints={stats?.mints ?? []} />

      <div style={{ background: "#d4c5a9", color: "#2a2520", border: "4px double #7a6540", padding: "24px 16px", textAlign: "center", margin: "16px 0" }}>
        <div style={{ display: "flex", justifyContent: "center" }}><FounderSeal size={72} ticker={false} /></div>
        <h2 dir="auto" style={{ fontFamily: SERIF, margin: "10px 0 4px" }}>{L.certTitle}</h2>
        <p dir="auto" style={{ margin: 0 }}>{L.certText}</p>
      </div>
      <SiteFooter t={L} />
      <AymanContact t={L} rtl={rtl} />
    </main>
    </>
  );
}
