"use client";
import { useState } from "react";

const FALLBACK = "/genesis-seal.png";

// Shows the crest; if it fails to load, swaps to the generic seal, and if that fails too, hides itself.
export default function CrestImage({ src, alt, maxWidth = 440, marginTop = 24 }: { src: string; alt: string; maxWidth?: number; marginTop?: number }) {
  const [current, setCurrent] = useState(src);
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      width={maxWidth}
      height={maxWidth}
      decoding="async"
      onError={() => (current !== FALLBACK ? setCurrent(FALLBACK) : setHidden(true))}
      style={{ display: "block", margin: `${marginTop}px auto 0`, width: "100%", maxWidth, height: "auto", aspectRatio: "1 / 1", objectFit: "contain", borderRadius: 12 }}
    />
  );
}
