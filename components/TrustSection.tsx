import Image from "next/image";
import FounderSeal from "./FounderSeal";
import { fmt, type Dict, type Lang } from "../lib/i18n";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const box: React.CSSProperties = { background: "#d4c5a9", color: "#2a2520", border: "3px double #7a6540", padding: 16 };
const h: React.CSSProperties = { fontFamily: SERIF, margin: "0 0 8px", fontSize: 16, letterSpacing: "0.06em", color: "#451a03" };
const a: React.CSSProperties = { color: "#7f1d1d", fontWeight: 700 };
const imgStyle: React.CSSProperties = { borderRadius: 20, border: "1px solid #1F3B44" };

const ALT: Record<Lang, string> = {
  en: "TEOS dig certificate - on-chain proof of the founder sovereign name",
  ar: "شهادة التخذ TEOS - الإثبات على السلسلة الاسم السيادي للمؤسس",
  id: "Sertifikat TEOS - bukti on-chain nama sovereign founder",
};

// Mint addresses come from /api/stats (stats.mints), same order as stats.founders.
export default function TrustSection({ t, founders, mints, lang = "en" }: { t: Dict; founders: string[]; mints: string[]; lang?: Lang }) {
  return (
    <section aria-labelledby="trust" style={{ margin: "16px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", marginBottom: 14 }}>
        <FounderSeal size={56} ticker={false} />
        <h2 id="trust" style={{ fontFamily: SERIF, letterSpacing: "0.1em", color: "#fef3c7", margin: 0 }}>{t.trustTitle}</h2>
      </div>
      {/* Founder dig certificate - under the founder names, capped to content column */}
      <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto 16px", textAlign: "center" }}>
        <Image src="/images/teos-dig-certificate.webp" width={1600} height={1067} alt={ALT[lang]} style={{ ...imgStyle, width: "100%", height: "auto", maxHeight: "50vh", objectFit: "cover" }} sizes="(max-width: 640px) 100vw, 640px" />
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <div style={box}>
          <h3 style={h}>{t.trustProof}</h3>
          {mints.map((m, i) => (
            <p key={m} style={{ margin: "0 0 8px" }}>
              {fmt(t.trustMinted, { n: founders[i] ?? m.slice(0, 6) })}{" "}
              <a style={a} href={`https://solscan.io/token/${m}`} target="_blank" rel="noopener noreferrer">{t.trustView}</a>
            </p>
          ))}
          <p style={{ margin: 0, fontSize: 14 }}>{t.trustStd}</p>
        </div>
        <div style={box}>
          <h3 style={h}>{t.trustGet}</h3>
          <p style={{ margin: 0 }}>{t.trustGetText}</p>
        </div>
        <div style={box}>
          <h3 style={h}>{t.trustPolicy}</h3>
          <p style={{ margin: "0 0 8px" }}>{t.trustPolicyText}</p>
          <a style={a} href="/terms">{t.terms}</a> · <a style={a} href="/privacy">{t.privacy}</a>
        </div>
      </div>
    </section>
  );
}
