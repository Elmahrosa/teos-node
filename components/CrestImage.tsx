"use client";
import { useState } from "react";

const FALLBACK = "/genesis-seal.png";

// Shows the crest; if it fails to load, swaps to the generic seal, and if that fails too, hides itself.
export default function CrestImage({ src, alt }: { src: string; alt: string }) {
  const [current, setCurrent] = useState(src);
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      width={440}
      height={440}
      decoding="async"
      onError={() => (current !== FALLBACK ? setCurrent(FALLBACK) : setHidden(true))}
      style={{ display: "block", margin: "24px auto 0", width: "100%", maxWidth: 440, height: "auto", aspectRatio: "1 / 1", objectFit: "contain", borderRadius: 12 }}
    />
  );
}
