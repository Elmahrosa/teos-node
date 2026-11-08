"use client";
import PageShell from "../../components/PageShell";
import WhyBuy from "../../components/WhyBuy";
import PricingTable from "../../components/PricingTable";
import PricingLogic from "../../components/PricingLogic";
import PaymentOptions from "../../components/PaymentOptions";
import TrustSection from "../../components/TrustSection";
import Divider from "../../components/Divider";
import FounderSeal from "../../components/FounderSeal";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLang } from "../../lib/useLang";

const toSearch = () => { window.location.href = "/#search"; };

// All the long-form content (why buy, pricing, payment, trust) lives here so the home page can stay short.
function Body({ L, rtl, lang }: { L: any; rtl: boolean; lang: any }) {
  const { t } = useLang();
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {}); }, []);
  const all: any[] = stats?.tlds ?? [];
  const copy = {
    en: ["TEOS Sovereign Root - Alexandria", "1 Key Unlocks The Full System - Sovereign Domain Is Just The Start", "Want a domain you own forever - setup - trade - design? You can. Want the full sovereign system - browser - gateway - your own world? You can too.", ".teos is the root - Eternal Metaplex Core on Solana - in your wallet - Same name unlocks 127 countries - saloma.teos unlocks saloma.eg", "The TEOS gate - unlock your sovereign"],
    ar: ["TEOS الجذر السيادي - من الإسكندرية", "مفتاح واحد يفتح المنظومة - الدومين السيادي هو البداية فقط", "عايز دومين تملكه للأبد - تسطبه - تتداوله - تعمل ديزاين؟ تقدر. عايز تخش المنظومة السيادية الكاملة - متصفح - جيت واي - عالمك الخاص؟ برضه تقدر.", ".teos هو الأصل - ملكية أبدية Metaplex Core على Solana - في محفظتك - نفس الاسم يفتح 127 دولة - saloma.teos يفتح saloma.eg", "بوابة TEOS - افتح اسمك السيادي"],
    id: ["TEOS Akar Berdaulat - Alexandria", "1 Kunci Membuka Seluruh Sistem - Domain Berdaulat Hanyalah Awal", "Mau domain yang Anda miliki selamanya - setup - trading - desain? Bisa. Mau sistem berdaulat penuh - browser - gateway - dunia Anda sendiri? Bisa juga.", ".teos adalah akarnya - Metaplex Core abadi di Solana - di dompet Anda - Nama yang sama membuka 127 negara - saloma.teos membuka saloma.eg", "Pintu masuk TEOS"],
  }[lang as "en" | "ar" | "id"];
  return (
    <>
      <header style={{ textAlign: "center", margin: "0 0 20px" }}>
        <h1 style={{ fontFamily: "Cinzel, Georgia, serif", fontWeight: 400, letterSpacing: "0.08em", color: "#f1e7cf", margin: "0 0 8px" }}>{copy[0]}</h1>
        <p dir="auto" style={{ margin: 0, fontSize: 18, color: "#d9c48a", fontWeight: 700 }}>{copy[1]}</p>
        <p dir="auto" style={{ margin: "12px 0 0", color: "#d6cbb5", lineHeight: 1.6 }}>{copy[2]}</p>
        <p dir="auto" style={{ margin: "12px 0 0", color: "#a89a80" }}>{copy[3]}</p>
      </header>
      <Image src="/images/teos-gate.webp" width={1600} height={1067} alt={copy[4]} priority style={{ borderRadius: 12, border: "1px solid #3d352a", width: "100%", height: "auto", display: "block", marginBottom: 20 }} sizes="(max-width: 1000px) 100vw, 1000px" />
      <WhyBuy t={L} countries={all.length} onCta={toSearch} />
      <PricingTable t={L} onBuy={toSearch} />
      <PricingLogic t={t} tlds={all} />
      <Divider />
      <PaymentOptions t={L} rtl={rtl} />
      <Divider />
      <TrustSection t={L} founders={stats?.founders ?? []} mints={stats?.mints ?? []} lang={lang} />
      <div style={{ background: "#d4c5a9", color: "#2a2520", border: "4px double #7a6540", padding: "24px 16px", textAlign: "center", margin: "16px 0" }}>
        <div style={{ display: "flex", justifyContent: "center" }}><FounderSeal size={72} ticker={false} /></div>
        <h2 dir="auto" style={{ margin: "10px 0 4px" }}>{L.certTitle}</h2>
        <p dir="auto" style={{ margin: 0 }}>{L.certText}</p>
      </div>
    </>
  );
}

export default function SystemPage() {
  return <PageShell>{({ lang, L, rtl }) => <Body L={L} rtl={rtl} lang={lang} />}</PageShell>;
}
