import { useId } from "react";

// Gold pharaoh mask drawn in SVG. No image file, no external asset.
// Used as the mark next to the TEOS wordmark and in the buy dialog.
export default function PharaohMark({ size = 48, glow = true }: { size?: number; glow?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size}
      role="img"
      aria-label="Pharaoh mask"
      style={{ display: "block", flexShrink: 0, filter: glow ? "drop-shadow(0 0 10px rgba(234,179,8,.45))" : undefined }}
    >
      <defs>
        <linearGradient id={`gold${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a0" />
          <stop offset="45%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        <linearGradient id={`lapis${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0b1220" />
        </linearGradient>
      </defs>

      {/* nemes headdress */}
      <path
        d="M60 4c23 0 41 13 47 31l6 47c2 14-7 20-17 16l-7-3v27c0 8-13 14-29 14s-29-6-29-14V95l-7 3c-10 4-19-2-17-16l6-47C19 17 37 4 60 4z"
        fill={`url(#lapis${id})`}
        stroke={`url(#gold${id})`}
        strokeWidth="3.5"
      />

      {/* headdress stripes */}
      <g stroke="#ca8a04" strokeWidth="2.5" opacity="0.9">
        <path d="M22 34c10-9 22-14 38-14s28 5 38 14" fill="none" />
        <path d="M19 46c11-9 24-14 41-14s30 5 41 14" fill="none" />
        <path d="M17 58c12-9 26-14 43-14s31 5 43 14" fill="none" />
        <path d="M16 72c12-9 27-14 44-14s32 5 44 14" fill="none" />
      </g>

      {/* face */}
      <path d="M37 48h46v32c0 18-9 31-23 31S37 98 37 80z" fill={`url(#gold${id})`} stroke="#713f12" strokeWidth="2" />

      {/* brows */}
      <g stroke="#1c1917" strokeWidth="3.5" strokeLinecap="round">
        <path d="M44 66c4-3 9-3 13 0" fill="none" />
        <path d="M63 66c4-3 9-3 13 0" fill="none" />
      </g>

      {/* eyes */}
      <g fill="#0b1220">
        <ellipse cx="50.5" cy="75" rx="5.5" ry="3.5" />
        <ellipse cx="69.5" cy="75" rx="5.5" ry="3.5" />
      </g>
      <g fill="#fef3c7">
        <circle cx="50.5" cy="75" r="1.6" />
        <circle cx="69.5" cy="75" r="1.6" />
      </g>

      {/* nose */}
      <path d="M60 78v9" stroke="#713f12" strokeWidth="3" strokeLinecap="round" />

      {/* mouth */}
      <path d="M51 95c6 4 12 4 18 0" stroke="#713f12" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* false beard */}
      <path d="M55 103h10l-2 22c0 3-6 3-6 0z" fill={`url(#gold${id})`} stroke="#713f12" strokeWidth="2" />

      {/* uraeus cobra */}
      <g transform="translate(60 40)">
        <path d="M0 0c-7-2-9-8-6-13 3-5 10-4 11 2 1 4-2 7-5 7" fill="#eab308" stroke="#713f12" strokeWidth="2" />
        <circle cx="-1" cy="-13" r="2" fill="#7f1d1d" />
      </g>
    </svg>
  );
}
