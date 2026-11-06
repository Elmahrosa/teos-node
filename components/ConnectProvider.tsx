"use client";
import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { MOBILE_WALLETS, type WalletId } from "@/lib/mobileWallet";

// The provider runs with autoConnect={false}, and the wallet modal only *selects* a wallet; nothing connects it.
// So after the user picks a wallet in the modal (modal closes with a wallet selected and not connected) we call
// connect() ourselves. On mobile Chrome that connect() opens the wallet app (see deepLinked in providers.tsx).
// A wallet remembered from an earlier visit is cleared on load, so it never reconnects by itself.
//
// A site opened by a wallet deep link carries ?connect=<wallet>: once that wallet's provider is injected
// (the in-app browser injects it a moment after load), select it and connect, so the approval prompt shows.
export default function ConnectProvider({ children }: { children: React.ReactNode }) {
  const { wallets, select, connect, connected, connecting, wallet } = useWallet();
  const { visible } = useWalletModal();
  const wanted = useRef<WalletId | null>(null);
  const modalSeen = useRef(false);
  const connectedFor = useRef<string | null>(null);
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    if (wallet && !connected && !new URL(location.href).searchParams.get("connect")) select(null);
  }, [wallet, connected, select]);

  useEffect(() => { if (visible) modalSeen.current = true; }, [visible]);
  useEffect(() => { if (!wallet) connectedFor.current = null; }, [wallet]);
  useEffect(() => {
    if (visible || !modalSeen.current || !wallet || connected || connecting || wanted.current) return;
    if (connectedFor.current === wallet.adapter.name) return;
    connectedFor.current = wallet.adapter.name;
    connect().catch(() => {});
  }, [visible, wallet, connected, connecting, connect]);
  const tried = useRef(false);

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
    let n = 0;
    const iv = setInterval(() => {
      n++;
      if (w.adapter.readyState === WalletReadyState.Installed) {
        clearInterval(iv); tried.current = true;
        connect().catch(() => {}).finally(() => { const u = new URL(location.href); u.searchParams.delete("connect"); history.replaceState(null, "", u.toString()); });
      } else if (n > 30) { clearInterval(iv); tried.current = true; }
    }, 200);
    return () => clearInterval(iv);
  }, [wallets, wallet, select, connect, connected, connecting]);

  return <>{children}</>;
}
