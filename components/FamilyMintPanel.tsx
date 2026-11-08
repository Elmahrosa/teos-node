"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

// Signed family mint panel. The browser never chooses the destination and never chooses a price:
// GET /api/founder/family returns the exact message (owner = server FAMILY_WALLET), the Founder
// wallet signs it, and POST /api/founder/family verifies the signature before minting.
// A dry run must succeed before the Mint button unlocks.

const DEFAULT_NAMES =
  "ashraf, anas, ehab, ekram, amira, soha, sohayb, salma, lareen, rovan, ahmed, layan";

type PlanRow = {
  name: string;
  price_usd: number | null;
  claimed: boolean;
  reserved: boolean;
  sealed: boolean;
  status: string;
};

type ResultRow = {
  name: string;
  ok: boolean;
  asset?: string;
  pending_mint?: boolean;
  error?: string;
};

const short = (w: string) => (w ? `${w.slice(0, 4)}...${w.slice(-4)}` : "");

export default function FamilyMintPanel() {
  const { publicKey, signMessage } = useWallet();
  const { setVisible } = useWalletModal();

  const [names, setNames] = useState(DEFAULT_NAMES);
  const [owner, setOwner] = useState("");
  const [plan, setPlan] = useState<PlanRow[] | null>(null);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const parsed = () =>
    names
      .split(/[\s,]+/)
      .map((s) => s.trim().toLowerCase().replace(/\.teos$/, ""))
      .filter(Boolean);

  async function run(dryRun: boolean) {
    setError("");
    if (!publicKey || !signMessage) {
      setVisible(true);
      return;
    }
    const list = parsed();
    if (!list.length) {
      setError("Enter at least one name");
      return;
    }
    if (!dryRun) {
      const ok = window.confirm(
        `Mint ${list.length} name(s) to ${owner || "the family wallet"}?\n\nThis is permanent and on-chain.`
      );
      if (!ok) return;
    }

    setBusy(true);
    if (dryRun) {
      setPlan(null);
      setResults(null);
    }
    try {
      const prep = await fetch(`/api/founder/family?names=${encodeURIComponent(list.join(","))}`, { cache: "no-store" });
      const pj = await prep.json();
      if (!prep.ok) throw new Error(pj.error || `http_${prep.status}`);
      setOwner(pj.owner || "");

      const sig = await signMessage(new TextEncoder().encode(pj.message));
      const signature = btoa(String.fromCharCode(...sig));

      const res = await fetch("/api/founder/family", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          names: list,
          signature,
          publicKey: publicKey.toBase58(),
          nonce: pj.nonce,
          dryRun,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `http_${res.status}`);

      if (dryRun) setPlan(j.names ?? []);
      else setResults(j.results ?? []);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  const box: React.CSSProperties = { border: "1px solid #333", borderRadius: 12, padding: 14, marginTop: 28 };
  const btn = (bg: string): React.CSSProperties => ({
    background: bg,
    color: "#000",
    border: 0,
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 800,
    cursor: busy ? "not-allowed" : "pointer",
    opacity: busy ? 0.6 : 1,
  });

  return (
    <section style={box} aria-label="Family mint">
      <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>Family Mint (Founder-signed)</h2>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
        Destination is fixed by the server (FAMILY_WALLET){owner ? `: ${short(owner)}` : ""}. You only sign the list.
      </div>

      <textarea
        value={names}
        onChange={(e) => {
          setNames(e.target.value);
          setPlan(null);
          setResults(null);
        }}
        rows={3}
        spellCheck={false}
        style={{ width: "100%", boxSizing: "border-box", background: "#111", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: 10, fontFamily: "ui-monospace, monospace", fontSize: 13 }}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <button style={btn("#eab308")} disabled={busy} onClick={() => run(true)}>
          {busy ? "Working..." : "1. Check (dry run)"}
        </button>
        <button style={btn("#ca8a04")} disabled={busy || !plan} onClick={() => run(false)} title={!plan ? "Run a successful dry run first" : ""}>
          2. Mint to Family Wallet
        </button>
      </div>

      {!publicKey && <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Connect the Founder wallet to sign.</p>}
      {publicKey && <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Connected: {short(publicKey.toBase58())}</p>}
      {error && <p role="alert" style={{ color: "#f87171", marginTop: 10 }}>{error}</p>}

      {plan && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Dry run</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.7 }}>
                <th style={{ padding: 6 }}>Name</th>
                <th style={{ padding: 6 }}>Price</th>
                <th style={{ padding: 6 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((r) => (
                <tr key={r.name} style={{ borderTop: "1px solid #222" }}>
                  <td style={{ padding: 6, fontFamily: "ui-monospace, monospace" }}>{r.name}.teos</td>
                  <td style={{ padding: 6 }}>{r.price_usd === null ? "—" : `$${r.price_usd.toLocaleString("en-US")}`}</td>
                  <td style={{ padding: 6, color: r.status === "free" ? "#4ade80" : "#f87171" }}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Mint result</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
            {results.map((r) => (
              <li key={r.name} style={{ padding: "6px 0", borderTop: "1px solid #222" }}>
                <b style={{ fontFamily: "ui-monospace, monospace" }}>{r.name}.teos</b>{" "}
                {r.ok ? (
                  <span style={{ color: "#4ade80" }}>
                    {r.pending_mint ? "claimed — mint queued" : `minted ${r.asset ? short(r.asset) : ""}`}
                  </span>
                ) : (
                  <span style={{ color: "#f87171" }}>{r.error || "failed"}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
