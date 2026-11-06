"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import MobileWalletSheet from "./MobileWalletSheet";
import { hasInjectedWallet, isMobileBrowser, MOBILE_WALLETS, type WalletId } from "@/lib/mobileWallet";

const Ctx = createContext<() => void>(() => {});
export const useConnect = () => useContext(Ctx);

const LABELS = {
  en: { title: "Connect a wallet", install: "Install {wallet}", other: "Other wallets", opening: "Opening...", close: "Close" },
  ar: { title: "اربط محفظتك", install: "ثبّت {wallet}", other: "محافظ أخرى", opening: "جارٍ الفتح...", close: "إغلاق" },
  id: { title: "Hubungkan dompet", install: "Pasang {wallet}", other: "Dompet lain", opening: "Membuka...", close: "Tutup" },
} as const;

// One entry point for "Connect wallet". Desktop and wallet in-app browsers get the standard modal.
// Mobile Chrome (no wallet injected) gets the sheet that opens Phantom / Solflare / Trust by deep link.
// Android Chrome also lists Solana Mobile Wallet Adapter under "Other wallets" (in the standard modal).
// A site opened by a deep link carries ?connect=<wallet>: connect to it as soon as it is injected.
export default function ConnectProvider({ children }: { children: React.ReactNode }) {
  const { setVisible } = useWalletModal();
  const { wallets, select, connect, connected, connecting, wallet } = useWallet();
  const [sheet, setSheet] = useState(false);
  const [lang, setLang] = useState<"en" | "ar" | "id">("en");
  const wanted = useRef<WalletId | null>(null);
  const tried = useRef(false);

  const open = useCallback(() => {
    if (isMobileBrowser() && !hasInjectedWallet()) {
      const l = document.documentElement.lang;
      setLang(l === "ar" || l === "id" ? l : "en");
      setSheet(true);
    } else setVisible(true);
  }, [setVisible]);

  useEffect(() => {
    const id = new URL(location.href).searchParams.get("connect") as WalletId | null;
    if (id && id in MOBILE_WALLETS) wanted.current = id;
  }, []);

  useEffect(() => {
    const id = wanted.current;
    if (!id || connected || connecting || tried.current) return;
    const name = MOBILE_WALLETS[id].adapterName;
    const w = wallets.find((x) => x.adapter.name === name);
    if (!w) return;
    if (wallet?.adapter.name !== name) { select(w.adapter.name); return; }
    // The in-app browser injects its provider a moment after load: wait for it, up to 6s.
    let n = 0;
    const iv = setInterval(() => {
      n++;
      if (w.readyState === WalletReadyState.Installed || w.adapter.readyState === WalletReadyState.Installed) {
        clearInterval(iv); tried.current = true;
        connect().catch(() => {}).finally(() => { const u = new URL(location.href); u.searchParams.delete("connect"); history.replaceState(null, "", u.toString()); });
      } else if (n > 30) { clearInterval(iv); tried.current = true; }
    }, 200);
    return () => clearInterval(iv);
  }, [wallets, wallet, select, connect, connected, connecting]);

  return (
    <Ctx.Provider value={open}>
      {children}
      {sheet && <MobileWalletSheet rtl={lang === "ar"} labels={LABELS[lang]} onClose={() => setSheet(false)} onOther={() => { setSheet(false); setVisible(true); }} />}
    </Ctx.Provider>
  );
}
