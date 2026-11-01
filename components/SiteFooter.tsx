import { FaLinkedin, FaXTwitter, FaFacebook, FaTelegram } from "react-icons/fa6";
import { SOCIAL } from "../lib/social";
import type { Dict } from "../lib/i18n";

const icon: React.CSSProperties = { color: "#D4AF37", display: "inline-flex", transition: "color .15s" };

export default function SiteFooter({ t }: { t: Dict }) {
  const links = [
    { label: "Ayman Seif LinkedIn", href: SOCIAL.linkedin, I: FaLinkedin },
    { label: "X", href: SOCIAL.x, I: FaXTwitter },
    { label: "Facebook", href: SOCIAL.facebook, I: FaFacebook },
    { label: "Telegram", href: SOCIAL.telegram, I: FaTelegram },
  ];
  return (
    <footer style={{ background: "#000", borderTop: "1px solid rgba(212,175,55,.2)", margin: "16px 0 96px", padding: "12px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ color: "#D4AF37", fontSize: 14 }}>{t.footerLine} - <a href={SOCIAL.website} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>ayman.elmahrosa.org</a></span>
        <div style={{ display: "flex", gap: 16 }}>
          {links.map(({ label, href, I }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label} style={icon} className="soc"><I size={20} /></a>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 13, color: "#a89a80" }}>
        <span>{t.wallets}</span>
        <span><a href="/terms" style={{ color: "inherit" }}>{t.terms}</a> · <a href="/privacy" style={{ color: "inherit" }}>{t.privacy}</a></span>
      </div>
      <div dir="ltr" style={{ marginTop: 10, textAlign: "center", fontSize: 11, letterSpacing: "0.2em", color: "#D4AF37" }}>{t.ticker}</div>
      <style>{`.soc:hover{color:#fff!important}`}</style>
    </footer>
  );
}
