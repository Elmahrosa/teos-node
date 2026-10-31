"use client";
import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

const API = process.env.NEXT_PUBLIC_API_URL || "https://teos-node.up.railway.app";
const STEPS = ["quote", "sign", "pay", "mint", "done"] as const;
type Step = (typeof STEPS)[number];

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...Array.from(u)));

export type CheckoutQuote = {
  quote_id: string;
  domain: string;
  price_sol: number;
  price_usd?: number;
  is_promo?: boolean;
  tlds?: string[];
  expires_at: number; // epoch ms
  message_to_sign: string;
  pay_to: string | null;
};

interface Props {
  domain: string;
  tlds: string[]; // backend expects { domain, tlds }
  durationYears?: number;
  treasury: string;
  amountSol: number;
  onMintComplete?: (tx: string, assetId: string) => void;
}

export function CheckoutPanel({ domain, tlds, durationYears = 2, treasury, amountSol, onMintComplete }: Props) {
  const { publicKey, signMessage, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const [step, setStep] = useState<Step>("quote");
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [sig, setSig] = useState("");
  const [payTx, setPayTx] = useState("");
  const [mintTx, setMintTx] = useState("");
  const [assetId, setAssetId] = useState("");
  const [loading, setLoading] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expiry, setExpiry] = useState(0); // seconds left

  // Countdown from quote expires_at (epoch ms).
  useEffect(() => {
    if (!quote?.expires_at) return;
    const end = new Date(quote.expires_at).getTime();
    const iv = setInterval(() => {
      const diff = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setExpiry(diff);
      if (diff <= 0) {
        clearInterval(iv);
        setError("Quote expired - please request a new quote");
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [quote]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // STEP 1: Get quote from Railway backend.
  const getQuote = async () => {
    setError(null);
    setLoading("quote");
    try {
      const res = await fetch(`${API}/api/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, tlds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Quote failed");
      setQuote(data);
      setStep("sign");
    } catch (e: any) {
      setError(e?.message || "Quote failed");
    } finally {
      setLoading(null);
    }
  };

  // STEP 2: Sign the quote message with the connected wallet (any wallet).
  const signQuote = async () => {
    setError(null);
    setLoading("sign");
    try {
      if (!connected || !publicKey || !signMessage || !quote) throw new Error("Connect a wallet first - Phantom, Solflare, Backpack, Glow, etc.");
      const encoded = new TextEncoder().encode(quote.message_to_sign);
      const signed = (await signMessage(encoded)) as any;
      const sigBytes: Uint8Array = signed?.signature ?? signed;
      setSig(b64(sigBytes));
      setStep("pay");
    } catch (e: any) {
      setError(e?.message || "Signature rejected");
    } finally {
      setLoading(null);
    }
  };

  // STEP 3: Pay the treasury from the connected wallet.
  const pay = async () => {
    setError(null);
    setLoading("pay");
    try {
      if (expiry === 0) throw new Error("Quote expired - get a new quote");
      if (!connected || !publicKey) throw new Error("Connect a wallet first");
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(treasury),
          lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
        })
      );
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setPayTx(sig);
      setStep("mint");
    } catch (e: any) {
      setError(e?.message || "Payment failed");
    } finally {
      setLoading(null);
    }
  };

  // STEP 4: Real register call - backend re-validates quote_id + signature + publicKey + payment_tx + domain.
  const register = async () => {
    setError(null);
    setLoading("mint");
    try {
      if (!quote) throw new Error("Get a quote first");
      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote_id: quote.quote_id,
          signature: sig,
          publicKey: publicKey?.toString(),
          payment_tx: payTx,
          domain,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Register failed");
      if (data.pending_mint) throw new Error("Payment and name recorded. The asset mint is pending - keep your payment signature and contact support.");
      setMintTx(data.mint_tx || payTx);
      setAssetId(data.asset || data.items?.[0]?.asset || domain);
      onMintComplete?.(data.mint_tx || payTx, data.asset || data.items?.[0]?.asset || domain);
      setStep("done");
    } catch (e: any) {
      setError(e?.message || "Register failed");
    } finally {
      setLoading(null);
    }
  };

  const downloadReceipt = () => {
    const receipt = {
      domain,
      tlds,
      quote_id: quote?.quote_id,
      payment_tx: payTx,
      mint_tx: mintTx,
      assetId,
      treasury,
      amount_sol: amountSol,
      amount_usd: quote?.price_usd ?? null,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${domain}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const viewInWallet = () => {
    window.open(`https://solscan.io/tx/${mintTx || payTx}`, "_blank");
  };

  const currentIdx = STEPS.indexOf(step);
  const isStepEnabled = (s: Step) => STEPS.indexOf(s) <= currentIdx;

  return (
    <div className="w-full rounded-[16px] border border-[#D4B779]/20 bg-[#0A0A0A] p-6 text-white">
      <div className="flex justify-between items-center gap-4">
        <h2 className="font-serif text-xl text-[#E8D5B0]">CHECKOUT</h2>
        <WalletMultiButton
          style={{ background: "#D4B779", color: "black", borderRadius: 999, height: 36, fontSize: 12 }}
        />
      </div>

      <div className="mt-2 text-xs text-zinc-500">{domain} • {tlds.map((t) => `.${t}`).join(" + ")} • {durationYears}Y</div>
      {quote && (
        <p className={`mt-2 font-mono text-xs ${expiry < 60 ? "text-red-400" : "text-[#D4B779]"}`}>
          Expires in {fmt(expiry)} • {domain}
        </p>
      )}

      {/* Stepper */}
      <div className="mt-4 flex justify-between">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-col items-center">
            <div
              className={`h-6 w-6 rounded-full border flex items-center justify-center text-[10px] ${
                i < currentIdx ? "bg-[#D4B779] text-black border-[#D4B779]" : i === currentIdx ? "border-[#D4B779] text-[#D4B779]" : "border-zinc-700 text-zinc-600"
              }`}
            >
              {i < currentIdx ? "✓" : loading === s ? "…" : i + 1}
            </div>
            <span className={`mt-1 text-[9px] tracking-widest ${i <= currentIdx ? "text-[#D4B779]" : "text-zinc-600"}`}>{s.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded bg-red-950/40 border border-red-800 p-3 text-sm text-red-300">
          {error}{" "}
          {error.includes("expired") && (
            <button onClick={getQuote} className="underline ml-2">Get new quote</button>
          )}
        </div>
      )}

      {/* Actions - gated */}
      <div className="mt-6 space-y-3">
        {step === "quote" && (
          <button disabled={!!loading} onClick={getQuote} className="w-full rounded-full bg-[#D4B779] py-3 font-bold text-black disabled:opacity-50">
            {loading === "quote" ? "Requesting quote…" : `Get Quote • ${tlds.join(", ")}`}
          </button>
        )}
        {step === "sign" && (
          <button disabled={!connected || !!loading} onClick={signQuote} className="w-full rounded-full bg-[#D4B779] py-3 font-bold text-black disabled:opacity-40">
            {loading === "sign" ? "Waiting for wallet…" : `Sign with Wallet${publicKey ? ` • ${publicKey.toString().slice(0, 6)}...` : ""}`}
          </button>
        )}
        {step === "pay" && (
          <button disabled={!!loading || expiry === 0} onClick={pay} className="w-full rounded-full bg-[#D4B779] py-3 font-bold text-black disabled:opacity-30">
            {loading === "pay" ? "Confirming payment…" : `Pay ${amountSol} SOL → Treasury`}
          </button>
        )}
        {step === "mint" && (
          <button disabled={!!loading} onClick={register} className="w-full rounded-full bg-[#D4B779] py-3 font-bold text-black disabled:opacity-50">
            {loading === "mint" ? "Minting on-chain…" : "Mint Domain"}
          </button>
        )}
        {step === "done" && (
          <>
            <div className="rounded-xl bg-[#D4B779]/10 border border-[#D4B779]/20 p-4 text-center">
              <p className="text-[#E8D5B0] font-bold">✓ SEALED</p>
              <p className="mt-1 font-mono text-xs text-zinc-400 break-all">Asset: {assetId} • TX: {mintTx}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={downloadReceipt} className="rounded-full border border-[#D4B779]/30 py-2.5 text-sm text-[#D4B779] hover:bg-[#D4B779]/10">Download Receipt</button>
              <button onClick={viewInWallet} className="rounded-full bg-[#D4B779] py-2.5 text-sm font-bold text-black hover:bg-[#E8D5B0]">View in Wallet</button>
            </div>
          </>
        )}
      </div>

      <p className="mt-4 text-center text-[10px] tracking-widest text-zinc-600">Secured by Sovereign Seal • Pay-to: {treasury.slice(0, 8)}...{treasury.slice(-6)}</p>
    </div>
  );
}
