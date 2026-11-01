import { ImageResponse } from "next/og";

export const alt = "TEOS - Sovereign WEB4 Domains";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated at build time, no image file needed.
export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#1a1611,#0a0806)", color: "#fef3c7", borderWidth: 12, borderStyle: "solid", borderColor: "#b8860b" }}>
        <div style={{ fontSize: 120, color: "#D4AF37" }}>⚓</div>
        <div style={{ fontSize: 84, letterSpacing: 12, fontWeight: 700 }}>SOVEREIGN TEOS</div>
        <div style={{ fontSize: 38, color: "#d6cbb5", marginTop: 16 }}>Register .teos and country domains as Solana assets</div>
        <div style={{ fontSize: 44, color: "#D4AF37", marginTop: 28 }}>$10 Genesis - first 100 keys</div>
        <div style={{ fontSize: 28, color: "#a89a80", marginTop: 20 }}>web4.elmahrosa.org</div>
      </div>
    ),
    size,
  );
}
