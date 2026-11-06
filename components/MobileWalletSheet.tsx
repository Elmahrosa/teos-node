"use client";
import { useEffect, useRef, useState } from "react";
import { MOBILE_WALLETS, playStoreUrl, walletLaunchHref, type WalletId } from "@/lib/mobileWallet";

const IDS: WalletId[] = ["phantom", "solflare", "trust"];
const btn: React.CSSProperties = { display: "block", width: "100%", boxSizing: "border-box", padding: "14px 16px", fontSize: 17, fontWeight: 700, textAlign: "center", textDecoration: "none", cursor: "pointer", background: "#d4af37", color: "#1a1611", border: "1px solid #7a6540", borderRadius: 4 };
const ghost: React.CSSProperties = { ...btn, background: "transparent", color: "#f5e6c4", border: "1px solid #57493a", fontWeight: 400 };

// Bottom sheet shown on mobile browsers that have no wallet injected. Each button opens the wallet app.
// If the page is still in the foreground 2s later the app did not open, so we show an Install button.
export default function MobileWalletSheet({ onClose, onOther, rtl, labels }: { onClose: () => void; onOther?: () => void; rtl: boolean; labels: { title: string; install: string; other: string; opening: string; close: string } }) {
  const [opening, setOpening] = useState<WalletId | null>(null);
  const [missing, setMissing] = useState<WalletId | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const hidden = () => { if (document.visibilityState === "hidden") { clearTimeout(timer.current); } };
    document.addEventListener("visibilitychange", hidden);
    return () => { document.removeEventListener("visibilitychange", hidden); clearTimeout(timer.current); };
  }, []);

  function open(id: WalletId) {
    setMissing(null); setOpening(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { if (document.visibilityState === "visible") { setOpening(null); setMissing(id); } }, 2000);
    window.location.href = walletLaunchHref(id);
  }

  return (
    <div dir={rtl ? "rtl" : "ltr"} role="dialog" aria-modal="true" aria-label={labels.title} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(5,4,3,.85)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #57493a", padding: 20, color: "#f5e6c4", boxSizing: "border-box" }}>
        <button onClick={onClose} aria-label={labels.close} style={{ float: "inline-end" as any, background: "none", border: 0, color: "#a89a80", fontSize: 26, cursor: "pointer" }}>×</button>
        <h2 style={{ margin: "0 0 14px", fontSize: 20, color: "#fef3c7" }}>{labels.title}</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {IDS.map((id) => (
            <div key={id} style={{ display: "grid", gap: 8 }}>
              <button style={btn} onClick={() => open(id)}>{opening === id ? labels.opening : MOBILE_WALLETS[id].label}</button>
              {missing === id && <a style={{ ...ghost, borderColor: "#d4af37", color: "#fbbf24" }} href={playStoreUrl(id)} target="_blank" rel="noopener noreferrer">{labels.install.replace("{wallet}", MOBILE_WALLETS[id].label)}</a>}
            </div>
          ))}
          {onOther && <button style={ghost} onClick={onOther}>{labels.other}</button>}
        </div>
      </div>
    </div>
  );
}
