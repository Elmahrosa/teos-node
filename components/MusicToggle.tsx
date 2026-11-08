"use client";
import { useEffect, useRef, useState } from "react";
import { CTRL } from "./LangMenu";

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
      style={{ ...CTRL, background: on ? "#713f12" : "#292321", color: on ? "#fef3c7" : "#d6cbb5" }}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9v6h4l5 4V5L8 9H4z" />
        {on ? <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}
      </svg>
    </button>
  );
}
