import FounderSeal from "./FounderSeal";
import { SOCIAL } from "../lib/social";
import type { Dict } from "../lib/i18n";

const P = {
  whatsapp: "M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.600-.9-2.200-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.500s1.100 2.900 1.200 3.100c.1.2 2.100 3.200 5.100 4.500.7.3 1.300.5 1.700.6.7.2 1.400.2 1.900.1.6-.1 1.700-.7 2-1.400.2-.7.2-1.300.2-1.400-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.600 15.100L2 22l5-1.300A10 10 0 1 0 12 2z",
  facebook: "M14 8V6.500c0-.7.2-1 1.100-1H17V2h-2.800C11.300 2 10 3.700 10 6v2H7.500v3.500H10V22h4V11.500h2.700L17 8z",
  x: "M17.8 3h3.100l-6.800 7.700L22 21h-6.200l-4.900-6.400L5.300 21H2.200l7.300-8.300L2 3h6.400l4.400 5.800zm-1.100 16.200h1.700L7.400 4.700H5.600z",
  telegram: "M21.500 3.500 2.900 10.700c-1.300.5-1.300 1.200-.2 1.500l4.700 1.500 1.800 5.600c.2.600.4.800.9.800.4 0 .6-.2.900-.5l2.300-2.300 4.700 3.500c.9.500 1.500.2 1.700-.8l3.100-14.700c.3-1.200-.5-1.800-1.300-1.400zM8.500 13.500l9.300-5.900c.4-.3.8-.1.500.2l-7.700 7-.3 3.200z",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.900 9h-3a15.700 15.700 0 0 0-1.400-6A8 8 0 0 1 18.900 11zM12 4c.8 1 1.700 3.100 1.900 7h-3.800C10.300 7.100 11.200 5 12 4zM4.600 13h3a15.700 15.700 0 0 0 1.400 6A8 8 0 0 1 4.600 13zm3-2h-3A8 8 0 0 1 9 5a15.700 15.700 0 0 0-1.400 6zM12 20c-.8-1-1.700-3.100-1.900-7h3.800c-.2 3.900-1.100 6-1.900 7zm3-1a15.700 15.700 0 0 0 1.400-6h3A8 8 0 0 1 15 19z",
};
const Icon = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d={d} /></svg>;
const round: React.CSSProperties = { width: 42, height: 42, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#292321", color: "#eab308", border: "1px solid #7a6540", textDecoration: "none", boxShadow: "0 3px 8px rgba(0,0,0,.5)" };
const pill: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 4, background: "linear-gradient(90deg,#b45309,#ca8a04)", color: "#000", border: "2px solid #713f12", fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 10px rgba(0,0,0,.5)" };

export default function SiteFooter({ t }: { t: Dict }) {
  const social = [
    { k: "facebook", label: "Facebook", href: SOCIAL.facebook },
    { k: "x", label: "X", href: SOCIAL.x },
    { k: "telegram", label: "Telegram", href: SOCIAL.telegram },
  ].filter((s) => s.href);
  return (
    <footer style={{ background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #3d352a", borderTop: "3px double #7a6540", padding: "28px 16px", margin: "16px 0", textAlign: "center", color: "#a89a80", boxShadow: "inset 0 2px 12px rgba(0,0,0,.6)" }}>
      <div style={{ display: "flex", justifyContent: "center" }}><FounderSeal size={64} /></div>
      <p style={{ margin: "12px 0 14px", color: "#d6cbb5", fontFamily: "Cinzel, Georgia, serif", letterSpacing: "0.08em" }}>{t.footerLine}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        <a style={pill} href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer"><Icon d={P.whatsapp} /><span dir="ltr">{SOCIAL.whatsappLabel}</span></a>
        <a style={pill} href={SOCIAL.website} target="_blank" rel="noopener noreferrer"><Icon d={P.globe} /><span dir="ltr">{SOCIAL.website.replace("https://", "")}</span></a>
      </div>
      {social.length > 0 && (
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
          {social.map((s) => <a key={s.k} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label} style={round}><Icon d={P[s.k as "x"]} /></a>)}
        </div>
      )}
      <div style={{ marginTop: 14, fontSize: 12, letterSpacing: "0.2em" }}>{t.certText}</div>
    </footer>
  );
}
