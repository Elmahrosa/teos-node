"use client";
import { useState } from "react";
import Link from "next/link";
import { SOCIAL } from "../lib/social";
import { VIEW_PROFILE } from "../lib/joined";
import type { Lang } from "../lib/i18n";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const GOLD = "#b8973f";
// Personal photo (not the NFT crest). Put the file at public/founder/seif.jpg; until it exists a plain initial plate shows.
const PHOTO = "/founder/seif.jpg";
const T = { en: "Founder", ar: "المؤسس", id: "Pendiri" } as const;
const icon: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 38, height: 34, boxSizing: "border-box", padding: "0 10px", border: "1px solid #57493a", borderRadius: 4, background: "#292321", color: "#d6cbb5", fontSize: 13, fontWeight: 700, textDecoration: "none" };

export default function FounderSpotlight({ lang }: { lang: Lang }) {
  const [broken, setBroken] = useState(false);
  return (
    <section aria-labelledby="founder" style={{ margin: "36px 0 8px", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "center", padding: 22, border: `1px solid ${GOLD}`, borderRadius: 6, background: "#17130f" }}>
      {broken ? (
        <div aria-hidden="true" style={{ width: 150, height: 150, borderRadius: "50%", border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 64, color: "#d9c48a", background: "radial-gradient(circle at 35% 30%,#2a2316,#14110d)" }}>S</div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={PHOTO} alt="Seif El Mahrosa" width={150} height={150} onError={() => setBroken(true)} style={{ width: 150, height: 150, borderRadius: "50%", objectFit: "cover", border: `2px solid ${GOLD}` }} />
      )}
      <div style={{ textAlign: "center", minWidth: 0 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.22em", color: "#d9c48a" }}>{T[lang].toUpperCase()}</div>
        <h2 id="founder" dir="ltr" style={{ fontFamily: SERIF, fontWeight: 400, letterSpacing: "0.08em", color: "#f1e7cf", margin: "6px 0 14px", fontSize: "clamp(22px,4vw,32px)" }}>Founder - Seif El Mahrosa</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", alignItems: "center" }}>
          <a href={SOCIAL.x} target="_blank" rel="noopener noreferrer" aria-label="X" title="X" style={icon}>𝕏</a>
          <a href={SOCIAL.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram" title="Telegram" style={icon}>Telegram</a>
          <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook" style={icon}>Facebook</a>
          <a href={SOCIAL.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn" style={icon}>LinkedIn</a>
          <Link href="/u/ayman" style={{ ...icon, background: GOLD, borderColor: GOLD, color: "#14110d" }}>{VIEW_PROFILE[lang]} →</Link>
        </div>
      </div>
    </section>
  );
}
