"use client";
import { useEffect, useState } from "react";
import FamilyMintPanel from "../../components/FamilyMintPanel";

// Gated server-side by middleware.ts (no valid founder session = redirect) and again by /api/visits.
// Both NFT lists are read-only. The Mint Wallet is display-only: it is NOT a founder identity
// and is never used for auth.

type NftItem = {
  id: string;
  name: string;
  image: string;
  collection: string;
  compressed: boolean;
  interface: string;
};

type Authority = { wallet?: string; balanceSol?: number | null; ready?: boolean };
type FounderResponse = { wallet?: string; total?: number; items?: NftItem[]; error?: string };
type MintResponse = { wallet?: string; balanceSol?: number | null; total?: number; items?: NftItem[]; error?: string; authority?: Authority };
type FamilyResponse = { wallet?: string; total?: number; items?: NftItem[]; error?: string };

const ERROR_TEXT: Record<string, string> = {
  founder_wallet_not_configured: "Founder wallet not configured in Railway",
  family_wallet_not_configured: "Family wallet (FAMILY_WALLET) not configured in Railway",
  mint_wallet_not_configured: "Mint wallet not configured in Railway",
  helius_not_configured: "HELIUS_API_KEY not configured in Railway",
  helius_unavailable: "Could not load on-chain data right now",
};

const short = (w: string) => (w ? `${w.slice(0, 4)}...${w.slice(-4)}` : "");

function NftSection({
  title,
  wallet,
  items,
  balanceSol,
  solUsd,
  badge,
  error,
  loading,
  note,
  holding,
}: {
  title: string;
  wallet: string;
  items: NftItem[] | null;
  balanceSol?: number | null;
  solUsd?: number | null;
  badge?: string;
  error: string;
  loading: boolean;
  note?: string;
  holding?: boolean;
}) {
  const usd = balanceSol !== undefined && balanceSol !== null && solUsd ? ` (~$${(balanceSol * solUsd).toFixed(2)})` : "";
  const meta = [
    wallet ? `Wallet: ${short(wallet)}` : "",
    balanceSol !== undefined && balanceSol !== null ? `Balance: ${balanceSol.toFixed(4)} SOL${usd}` : "",
    items ? `Total: ${items.length} NFT / cNFT` : "",
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <section style={{ marginTop: 28 }} aria-label={title}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>{title}</h2>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, padding: "2px 8px", borderRadius: 9999, background: badge === "READY TO MINT" ? "#166534" : "#374151" }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>{meta}</div>
      {note && <div style={{ fontSize: 12, opacity: 0.7, marginTop: -8, marginBottom: 12 }}>{note}</div>}

      {error && <p role="alert" style={{ color: "#f87171", margin: "8px 0" }}>{error}</p>}
      {!error && loading && <p style={{ opacity: 0.7 }}>Loading your NFTs / cNFTs...</p>}
      {!error && !loading && items !== null && items.length === 0 && <p style={{ opacity: 0.7 }}>No NFTs found</p>}

      {items !== null && items.length > 0 && (
        <div className="founder-nft-grid">
          {items.map((n, i) => (
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
                {holding && (
                  <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "#fbbf24" }}>
                    Holding for: {n.name || "Unnamed"} — Ready to Send
                  </div>
                )}
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
  );
}

export default function Founder() {
  const [total, setTotal] = useState<number | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [founder, setFounder] = useState<FounderResponse | null>(null);
  const [mint, setMint] = useState<MintResponse | null>(null);
  const [family, setFamily] = useState<FamilyResponse | null>(null);
  const [founderError, setFounderError] = useState("");
  const [mintError, setMintError] = useState("");
  const [familyError, setFamilyError] = useState("");
  const [solUsd, setSolUsd] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/visits").then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then((d) => { setTotal(typeof d.total === "number" ? d.total : null); setCountries(d.countries || []); }).catch((s) => { if (s === 401) window.location.href = "/founder/login"; });
  }, []);

  useEffect(() => {
    let alive = true;
    const get = (url: string) =>
      fetch(url).then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `http_${r.status}`);
        return d;
      });

    Promise.allSettled([get("/api/founder/nfts"), get("/api/founder/mint"), get("/api/founder/nfts?wallet=family"), get("/api/sol-price")]).then(([f, m, fam, p]) => {
      if (!alive) return;
      if (p.status === "fulfilled" && typeof p.value.sol_usd === "number") setSolUsd(p.value.sol_usd);
      if (f.status === "fulfilled") {
        setFounder(f.value);
        setFounderError(f.value.error ? ERROR_TEXT[f.value.error] || f.value.error : "");
      } else {
        setFounder({ wallet: "", items: [] });
        setFounderError("Could not load NFTs / cNFTs right now");
      }
      if (m.status === "fulfilled") {
        setMint(m.value);
        setMintError(m.value.error ? ERROR_TEXT[m.value.error] || m.value.error : "");
      } else {
        setMint({ wallet: "", balanceSol: null, items: [] });
        setMintError("Could not load the mint wallet right now");
      }
      if (fam.status === "fulfilled") {
        setFamily(fam.value);
        setFamilyError(fam.value.error ? ERROR_TEXT[fam.value.error] || fam.value.error : "");
      } else {
        setFamily({ wallet: "", items: [] });
        setFamilyError("Could not load the family wallet right now");
      }
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

      <NftSection
        title="Founder Vault"
        wallet={founder?.wallet ?? ""}
        items={founder?.items ?? null}
        badge="READ ONLY"
        error={founderError}
        loading={founder === null}
      />

      <NftSection
        title="Mint Wallet"
        wallet={mint?.wallet ?? ""}
        items={mint?.items ?? null}
        balanceSol={mint?.balanceSol ?? null}
        solUsd={solUsd}
        badge={mint === null ? "" : mint.authority?.ready ? "READY TO MINT" : "NO FUNDS"}
        error={mintError}
        loading={mint === null}
        note={
          mint?.authority?.wallet
            ? `Mint authority: ${short(mint.authority.wallet)} — ${(mint.authority.balanceSol ?? 0).toFixed(4)} SOL (this wallet signs and pays for mints)`
            : "Mint authority (MINT_AUTHORITY_KEYPAIR) not configured"
        }
      />

      <NftSection
        title="Family Holding Wallet"
        wallet={family?.wallet ?? ""}
        items={family?.items ?? null}
        badge="HOLDING"
        error={familyError}
        loading={family === null}
        holding
        note="Transfers must be signed by the family wallet itself — this dashboard cannot move them."
      />

      <FamilyMintPanel />
    </div>
  );
}
