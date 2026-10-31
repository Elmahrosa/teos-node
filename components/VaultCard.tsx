"use client";

export type VaultStatus = "SEALED" | "RESERVED" | "AVAILABLE";

interface VaultCardProps {
  domain: string;
  status: VaultStatus;
  assetId: string;
  owner: string;
  updateAuthority: string;
  priceSol: number;
  priceUsd: number;
  isOwner?: boolean;
  explorerBase?: string; // e.g. https://solscan.io
  onAcquire?: () => void;
  onTransfer?: () => void;
  onBurn?: () => void;
}

const statusStyles: Record<VaultStatus, string> = {
  SEALED: "bg-[#D4B779] text-black",
  RESERVED: "bg-zinc-800 text-[#D4B779] border border-[#D4B779]/30",
  AVAILABLE: "bg-white text-black",
};

export function VaultCard({
  domain,
  status,
  assetId,
  owner,
  updateAuthority,
  priceSol,
  priceUsd,
  isOwner = false,
  explorerBase = "https://solscan.io",
  onAcquire,
  onTransfer,
  onBurn,
}: VaultCardProps) {
  const short = (addr: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : "-");

  return (
    <div className="relative w-full max-w-[880px] rounded-[20px] border border-[#D4B779]/20 bg-[#0A0A0A] p-8 shadow-2xl">
      <div className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-[#D4B779]/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative text-center">
        <h1 className="font-serif text-5xl tracking-wide text-[#E8D5B0]">{domain.toUpperCase()}</h1>
        <div className={`mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-sm font-bold tracking-widest ${statusStyles[status]}`}>
          <span>🛡️</span> {status}
        </div>
      </div>

      {/* Details Grid */}
      <div className="relative mt-10 grid grid-cols-2 gap-8 border-y border-[#D4B779]/10 py-8">
        <div className="space-y-5">
          <div>
            <p className="text-xs tracking-widest text-[#D4B779]/70">ASSET ID</p>
            <p className="mt-1 font-mono text-sm text-zinc-300">{assetId}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-[#D4B779]/70">OWNER ADDRESS</p>
            <p className="mt-1 font-mono text-sm text-white">{short(owner)}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-[#D4B779]/70">UPDATE AUTHORITY</p>
            <p className="mt-1 font-mono text-sm text-white">{short(updateAuthority)}</p>
          </div>
        </div>
        <div className="border-l border-[#D4B779]/10 pl-8">
          <p className="text-xs tracking-widest text-[#D4B779]/70">PRICE</p>
          <p className="mt-2 font-serif text-5xl text-[#E8D5B0]">{priceSol.toFixed(2)} SOL</p>
          <p className="mt-1 text-sm text-[#D4B779]/60">≈ ${priceUsd.toLocaleString()} USD</p>
          <a href={`${explorerBase}/address/${owner}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-full border border-[#D4B779]/30 px-4 py-2 text-xs text-[#D4B779] hover:bg-[#D4B779]/10">
            View on Solscan →
          </a>
        </div>
      </div>

      {/* Actions */}
      <div className="relative mt-8">
        <p className="text-center text-xs tracking-widest text-[#D4B779]/50">ACTIONS {isOwner ? "(Owner-only: Transfer/Burn)" : ""}</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <button onClick={onAcquire} disabled={status !== "AVAILABLE"} className="rounded-full bg-[#D4B779] py-3 font-semibold text-black hover:bg-[#E8D5B0] transition disabled:opacity-40 disabled:cursor-not-allowed">Acquire</button>
          <button disabled={!isOwner} onClick={onTransfer} className="rounded-full border border-[#D4B779]/40 py-3 text-[#D4B779] disabled:opacity-30 hover:bg-[#D4B779]/10">Transfer</button>
          <button disabled={!isOwner} onClick={onBurn} className="rounded-full border border-[#D4B779]/40 py-3 text-[#D4B779] disabled:opacity-30 hover:bg-red-900/20 hover:text-red-300">Burn (owner-only)</button>
        </div>
      </div>
    </div>
  );
}
