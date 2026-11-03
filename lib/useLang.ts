"use client";
import { useCallback, useEffect, useState } from "react";
import { useMemo } from "react";
import { DICTS, type Lang } from "./i18n";
import { makeT } from "./locales";

// Saved choice (selectedLang), else the browser language, else English. Also sets <html lang dir>.
export function useLang() {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    let saved: Lang | null = null;
    try { saved = (localStorage.getItem("selectedLang") ?? localStorage.getItem("lang")) as Lang | null; } catch {}
    const nav = (navigator.language || "en").toLowerCase();
    const guess: Lang = saved && saved in DICTS ? saved : nav.startsWith("ar") ? "ar" : nav.startsWith("id") ? "id" : "en";
    setLangState(guess);
    // The head script hides <main> for ar/id until the saved language is applied, so no wrong-language flash.
    requestAnimationFrame(() => document.documentElement.removeAttribute("data-pending"));
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = useCallback((l: Lang) => { setLangState(l); try { localStorage.setItem("selectedLang", l); } catch {} }, []);
  const t = useMemo(() => makeT(lang), [lang]);
  // Owner-approved header/search strings from /locales override the matching dictionary keys.
  const L = useMemo(() => ({ ...DICTS[lang], search: t("header.search"), connect: t("header.connect"), checkBtn: t("hero.checkNow"), sovereignKey: t("hero.mandatory"), tkTop: t("header.live"), fi3: t("hero.welcome") }), [lang, t]);
  return { lang, setLang, L, t, rtl: lang === "ar" };
}
