"use client";
import Link from "next/link";
import { SOCIAL } from "../lib/social";
import OptImg from "./OptImg";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const GOLD = "#b8973f";
const CREDLY = "https://www.credly.com/badges/f14c9ae0-c594-4cf8-af37-398545f5b75f";
// Uploaded assets (drop the files at these paths): selfie, "BUILDING THE FUTURE WITH CLAUDE" banner, Claude Partner badge.
const PHOTO = "/founder/ayman.jpg";
const BANNER = "/founder/building-with-claude.jpg";
const BADGE = "/founder/claude-badge.png";
const btn: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 38, boxSizing: "border-box", padding: "0 16px", border: `1px solid ${GOLD}`, borderRadius: 4, background: "#292321", color: "#fef3c7", fontSize: 14, fontWeight: 700, textDecoration: "none" };

export default function FounderSpotlight() {
  return (
    <section aria-labelledby="founder" style={{ margin: "36px 0 8px", border: `1px solid ${GOLD}`, borderRadius: 6, overflow: "hidden", background: "#17130f", position: "relative" }}>
      <OptImg src={BANNER} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} />
      <div style={{ position: "relative", padding: 24, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "center" }}>
        <OptImg src={PHOTO} alt="Ayman Seif" style={{ width: 170, height: 170, borderRadius: "50%", objectFit: "cover", border: "4px solid #d9b24a", boxShadow: "0 0 0 2px #5c4a17, 0 0 24px rgba(217,178,74,.45)" }}
          fallback={<div aria-hidden="true" style={{ width: 170, height: 170, borderRadius: "50%", border: "4px solid #d9b24a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 70, color: "#d9c48a", background: "radial-gradient(circle at 35% 30%,#2a2316,#14110d)" }}>A</div>} />
        <div style={{ textAlign: "center", minWidth: 0, flex: "1 1 320px", maxWidth: 520 }}>
          <h2 id="founder" dir="ltr" style={{ fontFamily: SERIF, fontWeight: 700, letterSpacing: "0.08em", color: "#f1e7cf", margin: 0, fontSize: "clamp(22px,4vw,32px)" }}>AYMAN SEIF - FOUNDER &amp; CEO</h2>
          <p dir="ltr" style={{ margin: "8px 0 14px", color: "#d9c48a", fontSize: 15 }}>AI Infrastructure Architect | Security Engineer</p>
          <div dir="ltr" style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "center", textAlign: "start", margin: "0 0 16px" }}>
            <OptImg src={BADGE} alt="Claude Partner Badge - Claude Code" style={{ width: 84, height: 84, objectFit: "contain" }} />
            <div style={{ color: "#d6cbb5", fontSize: 13, lineHeight: 1.5 }}>
              <strong style={{ color: "#fef3c7" }}>Claude Partner Badge - Claude Code</strong><br />
              Issued by Anthropic<br />Issued to Ayman Seif - July 10, 2026<br />Expires Jan 10, 2027
            </div>
          </div>
          <div dir="ltr" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            <a href={CREDLY} target="_blank" rel="noopener noreferrer" style={{ ...btn, background: GOLD, color: "#14110d" }}>Verify My Badge</a>
            <a href={SOCIAL.linkedin} target="_blank" rel="noopener noreferrer" style={btn}>My CV</a>
            <a href="#products" style={btn}>See Our Products</a>
          </div>
          <p dir="ltr" style={{ margin: "14px 0 0", fontSize: 11, color: "#a89a80" }}>CPN membership does not imply endorsement by Anthropic.</p>
          <p style={{ margin: "10px 0 0" }}><Link href="/u/ayman" style={{ color: "#d9c48a", fontSize: 13 }}>AYMAN.TEOS - View Profile →</Link></p>
        </div>
      </div>
    </section>
  );
}
