"use client";
import { useEffect, useMemo, useState } from "react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { fmt, type Dict } from "../lib/i18n";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...Array.from(u)));
const gold: React.CSSProperties = { background: "linear-gradient(90deg,#b45309,#ca8a04)", color: "#000", border: "2px solid #713f12", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,.5)" };
const tablet: React.CSSProperties = { background: "#292321", color: "#f5e6c4", border: "1px solid #7a6540", borderRadius: 4, padding: "10px 16px", cursor: "pointer", fontSize: 15 };

export type MintQuote = { quote_id: string; price_sol: number; price_usd?: number; expires_at: number; message_to_sign: string; pay_to: string | null; tlds?: string[] };

type Phase = "choose" | "approve" | "signing" | "paying" | "minting" | "error";

export default function MintModal(props: { t: Dict; rtl: boolean; domain: string; quote: MintQuote; onClose: () => void; helpHref: string }) {
  const { t, rtl, domain, quote, onClose, helpHref } = props;
  const { publicKey, connected, signMessage, sendTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [phase, setPhase] = useState<Phase>("choose");
  const [err, setErr] = useState("");
  const [left, setLeft] = useState(() => Math.max(0, Math.floor((quote.expires_at - Date.now()) / 1000)));
  const tlds = quote.tlds ?? ["teos"];
  const list = tlds.map((x) => `${domain}.${x}`).join(" + ");

  useEffect(() => {
    const iv = setInterval(() => setLeft(Math.max(0, Math.floor((quote.expires_at - Date.now()) / 1000))), 1000);
    return () => clearInterval(iv);
  }, [quote.expires_at]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const expired = left <= 0;
  const clock = useMemo(() => `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`, [left]);
  const mobile = typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent);

  async function pay() {
    setErr("");
    try {
      if (!quote.pay_to) throw new Error("no_treasury");
      if (!publicKey) throw new Error(t.mmNone);
      if (!signMessage) throw new Error(t.mmNoSign);
      setPhase("signing");
      const pk = publicKey;
      const signed = await signMessage(new TextEncoder().encode(quote.message_to_sign));
      const signature = b64(signed);

      const bh = await fetch("/api/blockhash", { cache: "no-store" }).then((r) => r.json());
      if (!bh.blockhash) throw new Error("rpc_unavailable");
      const tx = new Transaction({ feePayer: pk, recentBlockhash: bh.blockhash }).add(
        SystemProgram.transfer({ fromPubkey: pk, toPubkey: new PublicKey(quote.pay_to), lamports: Math.round(quote.price_sol * 1e9) }),
      );
      const payment_tx: string = await sendTransaction(tx, connection);

      setPhase("minting");
      // The server reads the payment from the chain, so give it a few tries while the transfer confirms.
      let data: any = {};
      for (let i = 0; i < 8; i++) {
        const r = await fetch("/api/register", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ domain, quote_id: quote.quote_id, signature, publicKey: pk.toString(), payment_tx }),
        });
        data = await r.json().catch(() => ({}));
        if (r.ok) break;
        if (data.error === "payment_not_verified" && ["tx_not_found", "rpc_unavailable"].includes(data.reason) && i < 7) { await new Promise((s) => setTimeout(s, 3000)); continue; }
        throw new Error(data.message || data.error || `register_${r.status}`);
      }
      // Remember the name so country rows unlock (UI hint only; the server checks the wallet).
      if (tlds.includes("teos")) {
        try { const o = JSON.parse(localStorage.getItem("teosOwned") || "[]"); localStorage.setItem("teosOwned", JSON.stringify(Array.from(new Set([...o, domain])))); } catch {}
      }
      const q = new URLSearchParams({ tx: data.mint_tx || payment_tx, pay: payment_tx, names: list });
      if (data.asset) q.set("asset", data.asset);
      if (data.pending_mint) q.set("pending", "1");
      window.location.href = `/success?${q.toString()}`;
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
      setPhase("error");
    }
  }

  const busy = phase === "signing" || phase === "paying" || phase === "minting";
  return (
    <div dir={rtl ? "rtl" : "ltr"} role="dialog" aria-modal="true" aria-label={fmt(t.mmTitle, { list })} onClick={busy ? undefined : onClose} style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(5,4,3,.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: "linear-gradient(160deg,#2a2520,#1a1611)", border: "1px solid #57493a", padding: 20, color: "#f5e6c4", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,.8)" }}>
        {!busy && <button onClick={onClose} aria-label={t.close} style={{ position: "absolute", top: 8, insetInlineEnd: 12, background: "none", border: 0, color: "#a89a80", fontSize: 24, cursor: "pointer" }}>×</button>}
        <h2 dir="ltr" style={{ fontFamily: SERIF, margin: "0 0 10px", color: "#fef3c7", fontSize: 22, wordBreak: "break-all", textAlign: rtl ? "right" : "left" }}>{fmt(t.mmTitle, { list })}</h2>
        <div style={{ background: "#d4c5a9", color: "#2a2520", border: "3px double #7a6540", padding: 12, marginBottom: 12 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 18, fontWeight: 700 }}>{fmt(t.mmPrice, { usd: quote.price_usd ?? "", sol: quote.price_sol })}</div>
          <div style={{ fontSize: 13 }}>{t.mmLock}</div>
          <div role="timer" style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color: left < 60 ? "#7f1d1d" : "#451a03" }}>{expired ? t.mmExpired : fmt(t.mmTimer, { t: clock })}</div>
        </div>

        {!expired && (phase === "choose" || phase === "error") && (
          <>
            <p style={{ margin: "0 0 8px", color: "#a89a80", fontSize: 14 }}>{t.mmTwice}</p>
            <div style={{ display: "grid", gap: 8 }}>
              {!connected ? (
                <button style={gold} onClick={() => setVisible(true)}>{t.connect}</button>
              ) : (
                <>
                  <div dir="ltr" style={{ fontSize: 13, color: "#a89a80" }}>{wallet?.adapter.name}: {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}</div>
                  <button style={phase === "error" ? tablet : gold} onClick={pay}>{t.mmApprove}</button>
                  <button style={tablet} onClick={() => setVisible(true)}>{t.mmChoose}</button>
                </>
              )}
              {mobile && !connected && (
                <a style={{ ...tablet, display: "block", textAlign: "center", textDecoration: "none" }} href={`https://phantom.app/ul/browse/${encodeURIComponent(location.href)}?ref=${encodeURIComponent(location.origin)}`}>{t.mmOpenPhantom}</a>
              )}
            </div>
          </>
        )}
        {busy && <p role="status" style={{ fontWeight: 700 }}>{phase === "signing" ? t.mmSigning : phase === "paying" ? t.mmPaying : t.mmMinting}</p>}
        {phase === "error" && <p role="alert" style={{ color: "#f87171", wordBreak: "break-word" }}>{err}</p>}
        <p style={{ margin: "14px 0 0", fontSize: 13 }}><a style={{ color: "#a89a80" }} href={helpHref} target="_blank" rel="noopener noreferrer">{t.needHelp}</a></p>
      </div>
    </div>
  );
}
