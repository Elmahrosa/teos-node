"use client";
import { useEffect, useRef, useState } from "react";

// Background music toggle. Off by default, never autoplays: the <audio> element is created
// only after the first click, so nothing is fetched or played until the user asks for it.
const SRC = "/audio/temple-ambient.mp3";
const VOLUME = 0.15;

export default function MusicToggle({ rtl }: { rtl: boolean }) {
  const [on, setOn] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => { audio.current?.pause(); }, []);

  async function toggle() {
    if (on) {
      audio.current?.pause();
      setOn(false);
      return;
    }
    if (!audio.current) {
      const a = new Audio(SRC);
      a.loop = true;
      a.volume = VOLUME;
      a.preload = "auto";
      audio.current = a;
    }
    try {
      await audio.current.play();
      setOn(true);
    } catch {
      setOn(false);
    }
  }

  const label = on ? (rtl ? "إيقاف الموسيقى" : "Mute music") : (rtl ? "تشغيل الموسيقى" : "Play music");
  return (
    <button type="button" onClick={toggle} aria-pressed={on} aria-label={label} title={label}
      style={{ border: "1px solid #57493a", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 14, lineHeight: "20px", background: on ? "#713f12" : "#292321", color: on ? "#fef3c7" : "#d6cbb5" }}>
      {on ? "🔊" : "🔇"}
    </button>
  );
}
