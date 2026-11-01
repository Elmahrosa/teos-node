import en from "../locales/en.json";
import ar from "../locales/ar.json";
import id from "../locales/id.json";
import type { Lang } from "./i18n";

// Owner-approved copy for header, hero and pricing. All three files have identical keys.
// A key missing in ar/id falls back to English and warns in development.
export const LOCALES: Record<Lang, any> = { en, ar, id };

function dig(obj: any, path: string): string | undefined {
  let v = obj;
  for (const k of path.split(".")) v = v?.[k];
  return typeof v === "string" ? v : undefined;
}

export function makeT(lang: Lang) {
  return (path: string, vars?: Record<string, string>): string => {
    let s = dig(LOCALES[lang], path);
    if (s === undefined) {
      if (process.env.NODE_ENV === "development") console.warn(`[i18n] missing key "${path}" for "${lang}", using en`);
      s = dig(LOCALES.en, path) ?? path;
    }
    return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
  };
}
export type TFn = ReturnType<typeof makeT>;
