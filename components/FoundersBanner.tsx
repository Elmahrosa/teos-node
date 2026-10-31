// Founders launch banner as a papyrus scroll under a stone header strip. Code only, no image file.
// Price copy matches live pricing: 10 USD for the first 100 keys, then 30 USD.
const Ankh = () => (
  <svg viewBox="0 0 40 70" width="34" height="60" aria-hidden="true" style={{ flexShrink: 0 }}>
    <g fill="none" stroke="#713f12" strokeWidth="5" strokeLinecap="round">
      <ellipse cx="20" cy="16" rx="11" ry="13" />
      <path d="M20 29V66M6 42H34" />
    </g>
  </svg>
);

const TORN = "polygon(0% 6%,4% 0%,9% 5%,15% 1%,22% 6%,30% 0%,38% 5%,46% 1%,54% 6%,62% 0%,70% 5%,78% 1%,86% 6%,93% 0%,100% 5%,99% 40%,100% 70%,98% 100%,92% 95%,85% 100%,77% 95%,69% 100%,60% 95%,52% 100%,44% 95%,35% 100%,27% 95%,18% 100%,10% 95%,4% 100%,0% 94%,1% 60%)";

export default function FoundersBanner() {
  return (
    <a href="https://wa.me/201006167293" target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", maxWidth: 900, margin: "0 auto 28px", filter: "drop-shadow(0 10px 24px rgba(0,0,0,.7))" }}>
      <div style={{ background: "linear-gradient(180deg,#3a3128,#292321)", border: "1px solid #57493a", borderBottom: 0, textAlign: "center", padding: "10px 12px", color: "#eab308", fontFamily: "Cinzel, Georgia, serif", fontWeight: 700, letterSpacing: "0.22em", fontSize: 13 }}>
        DIG SITE 022 • ALEXANDRIA • 100 GENESIS KEYS
      </div>
      <div dir="rtl" style={{ clipPath: TORN, background: "radial-gradient(ellipse at center,#e0d3b8,#d4c5a9 60%,#bfae8c)", color: "#2a2520", padding: "34px 24px 40px", display: "flex", alignItems: "center", justifyContent: "center", gap: 20, textAlign: "center" }}>
        <Ankh />
        <div>
          <svg viewBox="0 0 120 60" width="90" height="45" role="img" aria-label="Eye of Horus">
            <g fill="none" stroke="#451a03" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 28C28 8 72 8 96 28C72 44 28 44 8 28Z" />
              <path d="M96 28C104 28 110 24 114 18" />
              <path d="M52 44C50 52 44 56 36 56" />
              <path d="M60 44C64 52 72 54 80 50" />
            </g>
            <circle cx="52" cy="26" r="9" fill="#451a03" />
          </svg>
          <div style={{ fontSize: 20, fontWeight: 700 }}>إطلاق المؤسسين الأوائل - 100 مفتاح فقط</div>
          <div style={{ fontSize: 38, fontWeight: 800, margin: "6px 0", color: "#451a03" }}>10$ فقط <span style={{ fontSize: 18, fontWeight: 400, textDecoration: "line-through", color: "#57493a" }}>بدلاً من 30$</span></div>
          <div style={{ fontSize: 15, color: "#3d352a" }}>ملكية أبدية على سولانا - إرث لا يحذف</div>
          <div style={{ fontSize: 26, margin: "10px 0", letterSpacing: 6 }} aria-hidden="true">🇪🇬 🇸🇦 🇦🇪 🇶🇦 🇲🇦 🇯🇴</div>
          <span style={{ display: "inline-block", background: "linear-gradient(90deg,#b45309,#ca8a04)", color: "#000", border: "2px solid #713f12", padding: "8px 22px", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 10px rgba(0,0,0,.4)" }}>احجز مفتاحك الآن عبر واتساب ←</span>
          <div dir="ltr" style={{ fontSize: 12, marginTop: 10, letterSpacing: "0.2em", color: "#57493a" }}>web4.elmahrosa.org • TEOS SOVEREIGN ROOT</div>
        </div>
        <Ankh />
      </div>
    </a>
  );
}
