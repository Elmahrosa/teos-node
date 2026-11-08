"use client";
import { useEffect, useRef, useState } from "react";

// Image from an uploaded asset. If the file is not there yet, nothing is drawn (or the fallback is), never a broken icon.
// The error can fire before hydration, so also check the element once mounted.
export default function OptImg({ src, alt, style, fallback }: { src: string; alt: string; style?: React.CSSProperties; fallback?: React.ReactNode }) {
  const [bad, setBad] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setBad(true);
  }, []);
  if (bad) return <>{fallback ?? null}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} onError={() => setBad(true)} style={style} />;
}
