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
    <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "12px 16px", background: "#000", borderTop: "1px solid rgba(212,175,55,.2)", margin: "16px 0 96px" }}>
      <span style={{ color: "#D4AF37", fontSize: 14 }}>{t.footerLine} - <a href={SOCIAL.website} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>ayman.elmahrosa.org</a></span>
      <div style={{ display: "flex", gap: 16 }}>
        {links.map(({ label, href, I }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label} style={icon} className="soc"><I size={20} /></a>
        ))}
      </div>
      <style>{`.soc:hover{color:#fff!important}`}</style>
    </footer>
  );
}
