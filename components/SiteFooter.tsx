import Link from "next/link";
import { SOCIAL } from "../lib/social";
import type { Dict } from "../lib/i18n";

const pill = (bg: string, color = "#fff"): React.CSSProperties => ({ background: bg, color, padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 13, textDecoration: "none", display: "inline-block" });
const dim: React.CSSProperties = { color: "#a89a80", fontSize: 13, textDecoration: "none" };

// Clean footer: Alexandria Egypt | Terms - Privacy | Socials. (Music credit lives on the Terms page.)
export default function SiteFooter({ t }: { t: Dict }) {
  return (
    <footer style={{ background: "#0a0806", borderTop: "1px solid #8a7335", margin: "40px 0 0", padding: "18px 16px", display: "flex", flexWrap: "wrap", gap: "12px 28px", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <span style={{ color: "#d9c48a", fontSize: 14, letterSpacing: "0.06em" }}>Alexandria Egypt</span>
      <span style={{ ...dim, display: "inline-flex", gap: 8 }}>
        <Link href="/terms" style={dim}>{t.terms}</Link><span aria-hidden="true">•</span><Link href="/privacy" style={dim}>{t.privacy}</Link>
      </span>
      <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }} className="soc">
        <a href={SOCIAL.x} target="_blank" rel="noopener noreferrer" style={pill("#fff", "#000")}>𝕏 KING_TEOS</a>
        <a href={SOCIAL.telegram} target="_blank" rel="noopener noreferrer" style={pill("#229ED9")}>Telegram</a>
        <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" style={pill("#1877F2")}>Facebook</a>
        <a href={SOCIAL.linkedin} target="_blank" rel="noopener noreferrer" style={pill("#0A66C2")}>LinkedIn</a>
      </span>
    </footer>
  );
}
