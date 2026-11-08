"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

// One audio element for the whole app, kept in the root layout so the music keeps playing while
// the visitor moves between pages (client-side navigation). Off by default, never autoplays: the
// element is created only after the first click.
const SRC = "/audio/temple-ambient.mp3";
const VOLUME = 0.15;

type Ctx = { on: boolean; toggle: () => void };
const MusicCtx = createContext<Ctx>({ on: false, toggle: () => {} });
export const useMusic = () => useContext(MusicCtx);

export default function MusicProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { audio.current?.pause(); }, []);
  const toggle = useCallback(async () => {
    if (audio.current && !audio.current.paused) {
      audio.current.pause();
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
    try { await audio.current.play(); setOn(true); } catch { setOn(false); }
  }, []);
  return <MusicCtx.Provider value={{ on, toggle }}>{children}</MusicCtx.Provider>;
}
