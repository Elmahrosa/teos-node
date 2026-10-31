"use client";
import { useState } from "react";
import { VaultCard } from "./VaultCard";
import { CheckoutPanel } from "./CheckoutPanel";

interface Props {
  domain: string;
  status: "SEALED" | "RESERVED" | "AVAILABLE";
  assetId: string;
  owner: string;
  updateAuthority: string;
  priceSol: number;
  priceUsd: number;
  treasury: string; // Railway env: TREASURY_ADDRESS
  tlds?: string[]; // e.g. ["teos","eg"] for baskets
  isOwner?: boolean;
}

export function VaultCheckoutFlow(props: Props) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [doneData, setDoneData] = useState<{ tx: string; assetId: string } | null>(null);

  const handleAcquire = () => {
    if (props.status !== "AVAILABLE") return;
    setShowCheckout(true);
  };

  const handleMintComplete = (tx: string, assetId: string) => {
    setDoneData({ tx, assetId });
  };

  return (
    <>
      <VaultCard
        domain={props.domain}
        status={props.status}
        assetId={props.assetId}
        owner={props.owner}
        updateAuthority={props.updateAuthority}
        priceSol={props.priceSol}
        priceUsd={props.priceUsd}
        isOwner={props.isOwner}
        onAcquire={handleAcquire}
        onTransfer={() => alert("Transfer: calls Railway POST /api/transfer (owner-only)")}
        onBurn={() => alert("Burn: calls Railway POST /api/burn (owner-only)")}
      />

      {/* Acquire Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-[900px]">
            <button onClick={() => setShowCheckout(false)} className="absolute -top-10 right-0 text-[#D4B779] text-sm hover:text-white">
              Close ✕
            </button>

            <CheckoutPanel
              domain={props.domain}
              tlds={props.tlds && props.tlds.length ? props.tlds : [props.domain.split(".").pop() || "teos"]}
              durationYears={2}
              treasury={props.treasury}
              amountSol={props.priceSol}
            />

            {doneData && (
              <div className="mt-4 rounded-xl border border-[#D4B779] bg-[#D4B779]/10 p-4 text-center">
                <p className="text-[#E8D5B0]">✓ Mint complete</p>
                <p className="mt-1 font-mono text-xs text-zinc-400">Asset: {doneData.assetId} • TX: {doneData.tx}</p>
                <button
                  onClick={() => {
                    setShowCheckout(false);
                    setDoneData(null);
                  }}
                  className="mt-3 rounded-full bg-[#D4B779] px-6 py-2 text-sm font-bold text-black"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
