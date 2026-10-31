import { useId } from "react";

// Red wax founder seal drawn in SVG and text only. No image file.
export default function FounderSeal({ size = 96 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="Founder seal: AYMAN TEOS, Alexandria Egypt"
      style={{ display: "block", flexShrink: 0, filter: "drop-shadow(0 0 10px rgba(255,215,0,.45)) drop-shadow(0 4px 6px rgba(0,0,0,.6))" }}
    >
      <defs>
        <radialGradient id={`w${id}`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#c2382f" />
          <stop offset="55%" stopColor="#8b1a14" />
          <stop offset="100%" stopColor="#5a0d0a" />
        </radialGradient>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a0" />
          <stop offset="100%" stopColor="#c9972b" />
        </linearGradient>
        <path id={`top${id}`} d="M 32 100 A 68 68 0 0 1 168 100" />
        <path id={`bot${id}`} d="M 24 100 A 76 76 0 0 0 176 100" />
      </defs>
      {/* wax blob with uneven edge */}
      <path d="M100 6c18 0 26 10 42 14 16 4 34 12 40 30 6 18-4 30-2 46 2 16 10 30 0 46-10 16-28 18-42 26-14 8-26 28-44 28s-28-18-44-26c-16-8-34-12-42-28-8-16 2-30 2-46S4 68 12 52c8-16 26-24 42-30C70 16 82 6 100 6z" fill={`url(#w${id})`} stroke="#4a0a07" strokeWidth="4" />
      <circle cx="100" cy="100" r="86" fill="none" stroke={`url(#g${id})`} strokeWidth="3" />
      <circle cx="100" cy="100" r="50" fill="none" stroke={`url(#g${id})`} strokeWidth="2" />
      <text fontSize="15" fontWeight="700" letterSpacing="2" fill={`url(#g${id})`} textAnchor="middle" fontFamily="Georgia, serif">
        <textPath href={`#top${id}`} startOffset="50%">AYMAN TEOS • FOUNDER</textPath>
      </text>
      <text fontSize="10.5" fontWeight="700" letterSpacing="1" fill={`url(#g${id})`} textAnchor="middle" fontFamily="Georgia, serif">
        <textPath href={`#bot${id}`} startOffset="50%">ALEXANDRIA • EGYPT • elMahrosa.org</textPath>
      </text>
      <text x="100" y="116" fontSize="52" textAnchor="middle" fill="#e9c24f" style={{ textShadow: "0 1px 0 #5a0d0a" }}>⚓</text>
      <g transform="translate(60 80)" stroke="#e9c24f" strokeWidth="3.5" fill="none" strokeLinecap="round">
        <ellipse cx="0" cy="5" rx="6" ry="8" />
        <path d="M0 13V40M-9 21H9" />
      </g>
      <g transform="translate(140 80)" stroke="#e9c24f" strokeWidth="3.5" fill="none" strokeLinecap="round">
        <ellipse cx="0" cy="5" rx="6" ry="8" />
        <path d="M0 13V40M-9 21H9" />
      </g>
    </svg>
  );
}
