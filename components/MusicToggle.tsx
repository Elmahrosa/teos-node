"use client";
import { CTRL } from "./LangMenu";
import { useMusic } from "./MusicProvider";

// Speaker button. The audio itself lives in MusicProvider (root layout) so it survives page changes.
export default function MusicToggle({ rtl }: { rtl: boolean }) {
  const { on, toggle } = useMusic();
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
