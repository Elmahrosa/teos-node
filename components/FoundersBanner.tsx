// Founders launch banner: code only, no image file. Price copy matches the live pricing: 10 USD for the first 100, then 30 USD.
export default function FoundersBanner() {
  const gold = "#ffd700";
  return (
    <a
      href="https://wa.me/201006167293"
      target="_blank"
      rel="noopener noreferrer"
      dir="rtl"
      style={{ display: "block", textDecoration: "none", textAlign: "center", color: gold, background: "linear-gradient(160deg,#000,#18181b)", border: "2px solid rgba(255,215,0,.6)", borderRadius: 20, padding: "28px 20px", margin: "0 auto 24px", maxWidth: 900, boxShadow: "0 0 40px rgba(255,215,0,.2)" }}
    >
      <svg viewBox="0 0 120 60" width="120" height="60" role="img" aria-label="Eye of Horus" style={{ filter: "drop-shadow(0 0 12px rgba(255,215,0,.6))" }}>
        <g fill="none" stroke="#ffd700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 28C28 8 72 8 96 28C72 44 28 44 8 28Z" />
          <path d="M96 28C104 28 110 24 114 18" />
          <path d="M52 44C50 52 44 56 36 56" />
          <path d="M60 44C64 52 72 54 80 50" />
        </g>
        <circle cx="52" cy="26" r="9" fill="#ffd700" />
        <circle cx="52" cy="26" r="3.5" fill="#000" />
      </svg>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>إطلاق المؤسسين الأوائل - 100 مفتاح فقط</div>
      <div style={{ fontSize: 40, fontWeight: 800, margin: "10px 0" }}>10$ فقط بدلاً من 30$</div>
      <div style={{ fontSize: 16, color: "#e8d9a0" }}>ملكية أبدية على سولانا - إرث لا يحذف</div>
      <div style={{ fontSize: 30, marginTop: 14, letterSpacing: 6 }} aria-hidden="true">🇪🇬 🇸🇦 🇦🇪 🇶🇦 🇲🇦 🇯🇴</div>
      <div dir="ltr" style={{ fontSize: 14, marginTop: 12, color: "#a9b0c3" }}>web4.elmahrosa.org</div>
    </a>
  );
}
