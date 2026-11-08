"use client";
import { useEffect, useState } from "react";

// Gated server-side by middleware.ts (no valid founder session = redirect) and again by /api/visits.
// The NFT / cNFT list is read-only for the configured founder wallet and sits behind the same password gate.

type NftItem = {
  id: string;
  name: string;
  image: string;
  collection: string;
  compressed: boolean;
  interface: string;
};

type NftResponse = { wallet?: string; total?: number; items?: NftItem[]; error?: string };

const NFT_ERROR_TEXT: Record<string, string> = {
  founder_wallet_not_configured: "Founder wallet not configured in Railway",
  helius_not_configured: "HELIUS_API_KEY not configured in Railway",
  helius_unavailable: "Could not load NFTs / cNFTs right now",
};

export default function Founder() {
  const [total, setTotal] = useState<number | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [nfts, setNfts] = useState<NftItem[] | null>(null);
  const [nftWallet, setNftWallet] = useState("");
  const [nftError, setNftError] = useState("");

  useEffect(() => {
    fetch("/api/visits").then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then((d) => { setTotal(typeof d.total === "number" ? d.total : null); setCountries(d.countries || []); }).catch((s) => { if (s === 401) window.location.href = "/founder/login"; });
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/founder/nfts")
      .then(async (r) => {
        const d: NftResponse = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `http_${r.status}`);
        return d;
      })
      .then((d) => {
        if (!alive) return;
        setNftWallet(d.wallet || "");
        setNfts(Array.isArray(d.items) ? d.items : []);
        setNftError(d.error ? NFT_ERROR_TEXT[d.error] || d.error : "");
      })
      .catch((e) => {
        if (!alive) return;
        setNfts([]);
        setNftError(e?.message === "unauthorized" ? "" : "Could not load NFTs / cNFTs right now");
      });
    return () => { alive = false; };
  }, []);

  async function logout() {
    await fetch("/api/founder/login", { method: "DELETE" });
    window.location.href = "/founder/login";
  }

  return (
    <div style={{ padding: 20, background: "#000", color: "#fff", minHeight: "100vh", fontFamily: "sans-serif", maxWidth: 1000, margin: "0 auto" }}>
      <style>{`.founder-nft-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}@media(min-width:768px){.founder-nft-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Founder Dashboard</h1>
        <button onClick={logout} style={{ background: "none", border: "1px solid #444", color: "#fff", borderRadius: 9999, padding: "6px 14px", cursor: "pointer" }}>Logout</button>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ fontSize: 60, fontWeight: 900, textAlign: "center", margin: "20px 0" }}>
          {total ?? "—"}
          <div style={{ fontSize: 16, fontWeight: 400 }}>{total === null ? "Visitor tracking not enabled" : "Real visitors"}</div>
        </div>
        <div style={{ textAlign: "center", fontSize: 22, marginBottom: 8 }}>Countries unlocked {countries.length} / 127</div>
        <div style={{ textAlign: "center", opacity: 0.6, marginBottom: 28 }}>{countries.length ? countries.join(" ") : "0"}</div>
      </div>

      <section style={{ marginTop: 8 }} aria-label="Founder NFTs and cNFTs">
        <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>NFTs / cNFTs</h2>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          {nftWallet ? `Wallet: ${nftWallet.slice(0, 4)}...${nftWallet.slice(-4)}` : ""}
          {nfts ? ` — Total: ${nfts.length} NFT / cNFT` : ""}
        </div>

        {nftError && <p role="alert" style={{ color: "#f87171", margin: "8px 0" }}>{nftError}</p>}
        {!nftError && nfts === null && <p style={{ opacity: 0.7 }}>Loading your NFTs / cNFTs...</p>}
        {!nftError && nfts !== null && nfts.length === 0 && <p style={{ opacity: 0.7 }}>No NFTs found</p>}

        {nfts !== null && nfts.length > 0 && (
          <div className="founder-nft-grid">
            {nfts.map((n, i) => (
              <article key={n.id || `${n.name}-${i}`} style={{ border: "1px solid #333", borderRadius: 12, overflow: "hidden", background: "#0a0a0a" }}>
                {n.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.image} alt={n.name || "NFT"} loading="lazy" style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block", background: "#111" }} />
                ) : (
                  <div style={{ width: "100%", aspectRatio: "1 / 1", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, opacity: 0.5 }}>No image</div>
                )}
                <div style={{ padding: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name || "Unnamed"}</div>
                  <div style={{ display: "inline-block", marginTop: 6, padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: n.compressed ? "#1d4ed8" : "#374151" }}>
                    {n.compressed ? "cNFT - Compressed" : "NFT"}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, fontFamily: "ui-monospace, monospace", opacity: 0.7 }}>
                    {n.id ? `${n.id.slice(0, 4)}...${n.id.slice(-4)}` : ""}
                  </div>
                  {n.collection && <div style={{ marginTop: 4, fontSize: 11, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.collection}</div>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
