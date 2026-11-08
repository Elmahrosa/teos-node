import { SOCIAL } from "../lib/social";
import type { Dict } from "../lib/i18n";

const pill = (bg: string, color = "#fff"): React.CSSProperties => ({ background: bg, color, padding: "8px 16px", borderRadius: 999, fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-block" });

// Footer: the four approved social links, the founder line, and legal links.
export default function SiteFooter({ t }: { t: Dict }) {
  return (
    <footer style={{ background: "#0a0806", borderTop: "1px solid #8a7335", margin: "32px 0 0", padding: "28px 16px 20px", textAlign: "center" }}>
      <p style={{ color: "#eab308", fontWeight: 900, fontSize: 14, letterSpacing: "0.2em", margin: "0 0 14px" }}>{t.followTitle}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", alignItems: "center" }} className="soc">
        <a href={SOCIAL.x} target="_blank" rel="noopener noreferrer" style={pill("#fff", "#000")}>𝕏 KING_TEOS</a>
        <a href={SOCIAL.telegram} target="_blank" rel="noopener noreferrer" style={pill("#229ED9")}>Telegram</a>
        <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" style={pill("#1877F2")}>Facebook</a>
        <a href={SOCIAL.linkedin} target="_blank" rel="noopener noreferrer" style={pill("#0A66C2")}>LinkedIn</a>
      </div>
      <p style={{ color: "#D4AF37", fontSize: 14, margin: "18px 0 0" }}>{t.footerLine} - <a href={SOCIAL.website} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>ayman.elmahrosa.org</a></p>
      <p style={{ color: "#a89a80", fontSize: 13, margin: "10px 0 0" }}>
        {t.wallets} · <a href="/terms" style={{ color: "inherit" }}>{t.terms}</a> · <a href="/privacy" style={{ color: "inherit" }}>{t.privacy}</a>
      </p>
      <p style={{ color: "#71717a", fontSize: 12, margin: "10px 0 0" }}>© 2026 ELMAHROSA - elmahrosa.org</p>
      <p style={{ color: "#52525b", fontSize: 11, margin: "6px 0 0" }}>Music: <a href="https://commons.wikimedia.org/wiki/File:ArabicQanunSample.ogg" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>Arabic qanun sample</a> by Ariel Qas, CC BY-SA 2.5, edited</p>
    </footer>
  );
}
