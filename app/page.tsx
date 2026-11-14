"use client";
import { useEffect, useRef, useState } from "react";
import Bidi from "../components/Bidi";
import Image from "next/image";
import FounderSeal from "../components/FounderSeal";
import PharaohMark from "../components/PharaohMark";
import PharaohStyles from "../components/PharaohStyles";
import DomainSearchPopup, { localeCountry } from "../components/DomainSearchPopup";
import CountryDropdown from "../components/CountryDropdown";
import AymanContact from "../components/AymanContact";
import MusicToggle from "../components/MusicToggle";
import WhatYouGet from "../components/WhatYouGet";
import SiteFooter from "../components/SiteFooter";
import InsideTeos from "../components/InsideTeos";
import HeroVideo from "@/components/HeroVideo";
import LanguageToggle from "../components/LanguageToggle";
import Divider from "../components/Divider";
import PricingTable from "../components/PricingTable";
import TrustSection from "../components/TrustSection";
import PaymentOptions from "../components/PaymentOptions";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

import WhyBuy from "../components/WhyBuy";
import MintModal, { type MintQuote } from "../components/MintModal";
import { fmt, type Lang } from "../lib/i18n";
import { useLang } from "../lib/useLang";
import { SOCIAL } from "../lib/social";
import { getPriceOrNull } from "../lib/pricing";

declare global { interface Window { solana?: any; phantom?: { solana?: any } } }

const imgStyle: React.CSSProperties = { borderRadius: 20, border: "1px solid #1F3B44" };
const ALT = {
  gate: { en: "The TEOS gate - unlock your sovereign", ar: "بوابة TEOS - افتح اسمك السيادي", id: "Pintu masuk TEOS" } as Record<Lang, string>,
  certificate: { en: "TEOS dig certificate", ar: "شهادة التخذ TEOS", id: "Sertifikat TEOS" } as Record<Lang, string>,
};
const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const card: React.CSSProperties = { background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #3d352a", borderRadius: 4, padding: 20, margin: "16px 0", boxShadow: "inset 0 2px 12px rgba(0,0,0,.6)" };
const btn: React.CSSProperties = { background: "linear-gradient(90deg,#b45309,#ca8a04)", color: "#000", border: "2px solid #713f12", borderRadius: 4, padding: "10px 18px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,.5)" };
const tablet: React.CSSProperties = { background: "#292321", color: "#d6cbb5", border: "1px solid #57493a", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 14 };
const input: React.CSSProperties = { background: "#c9b896", color: "#2a2520", border: "1px solid #8a7550", borderInline: "8px double #7a6540", borderRadius: 0, padding: "10px 12px", fontSize: 16, width: "100%", boxSizing: "border-box" };

export default function Home() {
  const { lang, setLang, L, t, rtl, fading } = useLang();
  const [stats, setStats] = useState<any>(null);
  const [name, setName] = useState("");
  const [checked, setChecked] = useState<any>(null);
  const [checkedFor, setCheckedFor] = useState("");
  const checkSeq = useRef(0);
  const [quote, setQuote] = useState<MintQuote | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [popup, setPopup] = useState(false);
  const [owned, setOwned] = useState<string[]>([]);
  const [myNames, setMyNames] = useState<string[]>([]);
  const [selectedTld, setSelectedTld] = useState("eg");
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const wallet = publicKey?.toBase58() ?? "";
  
  useEffect(() => {
    try { setOwned(JSON.parse(localStorage.getItem("teosOwned") || "[]")); } catch {}
    const lc = localeCountry(); if (lc) setSelectedTld(lc);
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    setMyNames([]);
    if (!wallet) return;
    let live = true;
    fetch(`/api/owns-teos?wallet=${encodeURIComponent(wallet)}`, { cache: "no-store" })
      .then((r) => r.json()).then((j) => { if (live && Array.isArray(j?.names)) setMyNames(j.names); }).catch(() => {});
    return () => { live = false; };
  }, [wallet]);

  const open = stats?.registration_open === true && stats?.mint_ready !== false;
  const clean = name.trim().toLowerCase().replace(/\.[a-z]{2,6}$/, "");

  const teosRes = checked && checkedFor === clean ? checked.results?.find((x: any) => x.tld === "teos") ?? null : null;
  const teosPrice = clean ? getPriceOrNull(clean, "teos") : null;
  const canStickyBuy = !!open && !!teosRes?.available && !busy;

  const all: any[] = stats?.tlds ?? [];

  async function run(fn: () => Promise<void>) {
    setBusy(true); setMsg("");
    try { await fn(); } catch (e: any) { setMsg(e?.message || "Something went wrong"); } finally { setBusy(false); }
  }

  const check = () => run(async () => {
    const seq = ++checkSeq.current;
    setChecked(null); setCheckedFor(""); setQuote(null); setPopup(true);
    const r = await fetch(`/api/check?name=${encodeURIComponent(clean)}&tlds=teos${wallet ? `&wallet=${encodeURIComponent(wallet)}` : ""}`);
    const j = await r.json();
    if (seq !== checkSeq.current) return; // a newer search replaced this one
    if (!r.ok) { setPopup(false); throw new Error(j.error || "Invalid name"); }
    setChecked(j); setCheckedFor(clean);
    if (!stats?.tlds) setStats(await fetch("/api/stats", { cache: "no-store" }).then((x) => x.json()).catch(() => stats));
  });

  const mint = (tlds: string[]) => run(async () => {
    const q = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain: clean, tlds, wallet: wallet || undefined }) });
    const qj = await q.json();
    if (!q.ok) throw new Error(qj.message || qj.error || "Could not get a price");
    if (qj.available === false) throw new Error(`.${qj.tld} is ${qj.reason}`);
    setQuote(qj); setPopup(false);
  });

  const goSearch = () => {
    document.getElementById("search")?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => document.getElementById("n")?.focus(), 400);
  };
  const connectWallet = () => setVisible(true);

  return (
    <>
    <PharaohStyles />
    {/* TODO(automated-discount): the manual Telegram "Old Pioneers" promo (send proof, founder mints by hand) was removed from the public UI.
        An automated on-chain version plugs in here: check the wallet's on-chain TEOS holdings server-side in /api/quote, then show the discounted quote in the normal checkout. */}
    <div role="status" style={{ background: "#10B981", color: "#fff", textAlign: "center", padding: "9px 12px", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}>LIVE FROM ALEXANDRIA - 126 NAMESPACES REGISTERED • 13 MINTED</div>
    <nav className="site-nav" style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(10,8,6,.94)", backdropFilter: "blur(8px)", borderBottom: "1px solid #3d352a" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><PharaohMark size={46} /><div><div style={{ fontFamily: SERIF, fontSize: 24, letterSpacing: "0.2em", color: "#fef3c7", lineHeight: 1 }}>TEOS Sovereign Root</div><div style={{ fontSize: 10, letterSpacing: "0.25em", color: "#a89a80", marginTop: 4 }}>{L.tagline}</div></div></div>
        <span style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <a className="nav-dup" href="#search" style={{ ...tablet, textDecoration: "none" }}>{L.search}</a>
          <button style={{ ...btn, padding: "4px 14px", fontSize: 14 }} onClick={connectWallet}>{wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : L.connect}</button>
          <span className="nav-dup" style={{ ...tablet, cursor: "default", fontFamily: "ui-monospace, monospace" }}><Bidi text={t("header.tlds")} /></span>
        </span>
      </div>
    </nav>
    <HeroVideo rtl={rtl} searchLabel={L.search} connectLabel={wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : L.connect} onSearch={goSearch} onConnect={connectWallet} />
    <section aria-label={ALT.gate[lang]} style={{ boxSizing: "border-box", width: "100%", maxWidth: 1000, margin: "0 auto", padding: "20px 12px 0" }}>
      <Image src="/images/teos-gate.webp" width={1600} height={1067} alt={ALT.gate[lang]} priority style={{ ...imgStyle, width: "100%", height: "auto", display: "block" }} sizes="(max-width: 1000px) 100vw, 1000px" />
    </section>
    <main dir={rtl ? "rtl" : "ltr"} lang={lang} data-fading={fading ? "1" : undefined} style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 120px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
        <MusicToggle rtl={rtl} />
        <LanguageToggle lang={lang} onChange={setLang} />
      </div>

      {/* HERO V14 SOVEREIGN - DUAL PATH */}
      <header style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(26px,5vw,44px)", color: "#fef3c7", letterSpacing: "0.08em", margin: "0 0 8px", textShadow: "0 2px 6px rgba(0,0,0,.8)" }}>
          {lang === "ar" ? "TEOS الجذر السيادي - من الإسكندرية" : lang === "id" ? "TEOS Akar Berdaulat - Alexandria" : "TEOS Sovereign Root - Alexandria"}
        </h2>
        <p dir="auto" style={{ margin: 0, fontSize: 20, color: "#fbbf24", fontWeight: 700 }}>
          {lang === "ar" ? "مفتاح واحد يفتح المنظومة - الهوية السيادية الرقمية هي البداية فقط" : lang === "id" ? "1 Kunci Membuka Seluruh Sistem - Identitas Digital Berdaulat Hanyalah Awal" : "1 Key Unlocks The Full System - Sovereign Digital Identity Is Just The Start"}
        </p>
        <p dir="auto" style={{ margin: "12px 0 0", fontSize: 17, color: "#d6cbb5", lineHeight: 1.6 }}>
          {lang === "ar" 
            ? "عايز هوية سيادية رقمية تملكها للأبد - تسطبه - تتداوله - تعمل ديزاين؟ تقدر. عايز تخش المنظومة السيادية الكاملة - متصفح - جيت واي - عالمك الخاص؟ برضه تقدر."
            : lang === "id"
            ? "Mau identitas digital berdaulat yang Anda miliki selamanya - setup - trading - desain? Bisa. Mau sistem berdaulat penuh - browser - gateway - dunia Anda sendiri? Bisa juga."
            : "Want a sovereign digital identity you own forever - setup - trade - design? You can. Want the full sovereign system - browser - gateway - your own world? You can too."}
        </p>
        <p dir="auto" style={{ margin: "12px 0 0", fontSize: 16, color: "#a89a80" }}>
          {lang === "ar" 
            ? ".teos هو الأصل - ملكية أبدية Metaplex Core على Solana - في محفظتك - yourname.teos هو مفتاحك الجذري. مساحات الدول تفتح قريبا."
            : lang === "id"
            ? ".teos adalah akarnya - Metaplex Core abadi di Solana - di dompet Anda - yourname.teos adalah kunci akar Anda. Namespace negara segera dibuka."
            : ".teos is the root - Eternal Metaplex Core on Solana - in your wallet - yourname.teos is your root key. Country namespaces open soon."}
        </p>
        <p dir="auto" data-testid="hero-explainer" style={{ margin: "12px 0 0", fontSize: 16, color: "#eab308" }}>{L.teosIdWorks}</p>
      </header>

      <div id="search" style={{ ...card, position: "relative", overflow: "hidden", padding: "28px 20px", border: "3px double #ca8a04", borderRadius: 8, boxShadow: "0 0 42px rgba(234,179,8,.12), inset 0 2px 12px rgba(0,0,0,.6)" }}>
        <div className="pharaoh-hiero" aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "repeating-linear-gradient(0deg,#6b5a3e 0 1px,transparent 1px 38px),repeating-linear-gradient(90deg,#6b5a3e 0 1px,transparent 1px 64px),radial-gradient(circle at 30% 20%,#8a7550,transparent 60%)" }} />
        <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "center" }}>
          <svg aria-hidden="true" viewBox="0 0 400 400" width="100%" style={{ maxWidth: 300, height: "auto", filter: "drop-shadow(0 0 22px rgba(234,179,8,.55))" }}>
            <g fill="none" stroke="#eab308" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="200" cy="105" rx="52" ry="68" /><path d="M200 173V350M130 215H270" /><path d="M150 300c0 40 100 40 100 0M130 280l20 20M270 280l-20 20" strokeWidth="10" /></g>
            <circle cx="200" cy="105" r="14" fill="#7f1d1d" stroke="#eab308" strokeWidth="4" />
          </svg>
          <div style={{ flex: "1 1 360px", textAlign: "center", minWidth: 0 }}>
            <label htmlFor="n" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{L.find}</label>
            <input id="n" dir="auto" style={{ ...input, fontSize: 21, padding: "16px 14px", textAlign: "center" }} value={name} placeholder={t("hero.searchPlaceholder")} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && clean && check()} />
            <div style={{ margin: "12px 0" }}><CountryDropdown tlds={all} selected={selectedTld} onSelect={setSelectedTld} placeholder={L.country} empty={L.dropdownEmpty} /></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, textAlign: "center" }}>
              {(() => {
                const res = checked && checkedFor === clean ? checked.results?.find((x: any) => x.tld === "teos") ?? null : null;
                const youOwn = !!res && !!wallet && (myNames.includes(clean) || owned.includes(clean));
                const free = !!res?.available && !youOwn;
                const state = !res ? "" : youOwn ? L.youOwnU : free ? L.availableU : res.reason === "reserved" ? L.reservedU : L.takenU;
                return (<>
                  <div style={{ flex: "1 1 200px", background: "#d4c5a9", color: "#2a2520", border: "3px double #7a6540", padding: 12, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "center" }}><FounderSeal size={56} /></div>
                    <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, overflowWrap: "anywhere" }}>{clean || "name"}.teos</div>
                    <div dir="auto" style={{ fontSize: 12, color: res && !free && !youOwn ? "#7f1d1d" : youOwn || free ? "#14532d" : "#7f1d1d", fontWeight: 700 }}>{res ? state : L.sovereignKey}</div>
                    {(!res || free) && <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 18 }}>{free && clean ? `$${(getPriceOrNull(clean, "teos") ?? 0).toLocaleString("en-US")}` : "—"}</div>}
                  </div>
                  {(!res || free) && (
                    <div style={{ flex: "1 1 200px", background: "#2a2520", border: "1px solid #57493a", padding: 12, minWidth: 0, opacity: owned.includes(clean) ? 1 : 0.85 }}>
                      <div style={{ fontSize: 28 }}>{owned.includes(clean) ? "🔓" : "🔒"}</div>
                      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, overflowWrap: "anywhere" }}>{clean || "name"}.{selectedTld}<InsideTeos t={L} /></div>
                      <div dir="auto" style={{ fontSize: 12, color: owned.includes(clean) ? "#4ade80" : "#f87171", fontWeight: 700 }}>{owned.includes(clean) ? "" : <Bidi text={t("hero.locked", { tld: ".teos" })} />}</div>
                      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 18 }}>{clean && owned.includes(clean) ? `$${(getPriceOrNull(clean, selectedTld) ?? 0).toLocaleString("en-US")}` : "—"}</div>
                    </div>
                  )}
                </>);
              })()}
            </div>
            <p style={{ margin: "16px 0 0" }}><button style={{ ...btn, fontSize: 18, padding: "14px 28px" }} disabled={busy || !clean} onClick={check}>{L.checkBtn}</button></p>
            <p style={{ margin: "12px 0 0", color: "#a89a80", fontSize: 13, letterSpacing: "0.06em" }}>{all.length ? fmt(L.sovTlds, { n: all.length }) : ""} • {L.rule}</p>
          </div>
        </div>
      </div>

      {popup && (<DomainSearchPopup key={clean} t={L} rtl={lang === "ar"} homeTld={selectedTld} name={clean} teos={checked && checkedFor === clean ? checked.results?.find((x: any) => x.tld === "teos") ?? null : null} tlds={all} ownsTeos={!!wallet && (myNames.includes(clean) || owned.includes(clean))} wallet={wallet} founder={clean === "elmahrosa"} open={open} busy={busy} msg={msg} onBuy={mint} onClose={() => setPopup(false)} />)}
      {quote && <MintModal t={L} rtl={rtl} domain={clean} quote={quote} onClose={() => setQuote(null)} helpHref={SOCIAL.help} />}
      {msg && <p role="alert" style={{ color: "#f87171" }}>{msg}</p>}

      <WhyBuy t={L} countries={Math.max(all.length - 1, 0)} onCta={goSearch} />
      <PricingTable t={L} onBuy={goSearch} />
      <Divider />
      <div style={{ textAlign: "center", margin: "8px 0 8px" }}><button onClick={goSearch} style={{ ...btn, fontSize: 26, padding: "20px 48px", letterSpacing: "0.1em", fontFamily: SERIF, boxShadow: "0 0 30px rgba(202,138,4,.7), 0 6px 14px rgba(0,0,0,.6)" }}>{L.reserve}</button></div>
      <PaymentOptions t={L} rtl={rtl} />
      <Divider />
      <WhatYouGet />
      <TrustSection t={L} founders={stats?.founders ?? []} mints={stats?.mints ?? []} lang={lang} />
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
