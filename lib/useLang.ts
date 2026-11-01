"use client";
import { useCallback, useEffect, useState } from "react";
import { DICTS, type Lang } from "./i18n";

// Saved choice (selectedLang), else the browser language, else English. Also sets <html lang dir>.
export function useLang() {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = (localStorage.getItem("selectedLang") ?? localStorage.getItem("lang")) as Lang | null;
    const nav = (navigator.language || "en").toLowerCase();
    const guess: Lang = saved && saved in DICTS ? saved : nav.startsWith("ar") ? "ar" : nav.startsWith("id") ? "id" : "en";
    setLangState(guess);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = useCallback((l: Lang) => { setLangState(l); localStorage.setItem("selectedLang", l); }, []);
  return { lang, setLang, L: DICTS[lang], rtl: lang === "ar" };
}
