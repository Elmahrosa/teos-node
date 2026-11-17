"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import MintModal, { type MintQuote } from "../../../components/MintModal";
import { useLang } from "../../../lib/useLang";
import { SOCIAL } from "../../../lib/social";
import InsideTeos from "../../../components/InsideTeos";
import { displayName, needsBadge } from "../../../lib/display";
import { clearProof, fetchJson, readProof, saveProof, signatureToBase64, SIGN_REQUEST_TIMEOUT_MS, TimeoutError, withTimeout, type Proof } from "../../../lib/sign-flow";

type Row = { tld: string; flag: string; label: string; domain: string; price_usd: number; status: "owned" | "available" | "reserved" };
// The server accepts a dashboard signature for 300s; keep a small margin so it never arrives stale.
const PROOF_TTL_MS = 285_000;
const COLOR = { owned: "#555", available: "#16a34a", reserved: "#a16207" } as const;

export default function DashboardClient({ name }: { name: string }) {
  const { publicKey, signMessage } = useWallet();
  const { L, rtl } = useLang();
  const [mintQuote, setMintQuote] = useState<MintQuote | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [notOwner, setNotOwner] = useState(false);
  const [avail, setAvail] = useState<string | null>(null);
  const [sel, setSel] = useState<Row | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resumeReady, setResumeReady] = useState(false);

  // A signature that reached this page is kept for its server window. Refreshing the page, or coming
  // back from the wallet app, finishes the check without asking the wallet to sign again.
  async function verifyProof(proof: Proof) {
    const { ok, json: j } = await fetchJson(`/api/dashboard/${encodeURIComponent(name)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ publicKey: proof.publicKey, signature: proof.signature, ts: proof.ts }),
    });
    if (ok) {
      setRows(j.rows);
      setNotOwner(false);
      setMsg(null);
      setResumeReady(true);
      return;
    }
    if (j.error === "signature_expired" || j.error === "invalid_signature" || j.error === "not_owner") {
      clearProof(name);
      setResumeReady(false);
    }
    if (j.error === "not_owner") {
      setNotOwner(true);
      try {
        const a = await (await fetch(`/api/availability?domain=${encodeURIComponent(name)}`)).json();
        setAvail(a.available ? `${name}.teos is available` : `${name}.teos is not available`);
      } catch {
        // Availability is only a hint; not_owner is already the answer.
      }
      return;
    }
    setMsg(j.error === "ownership_check_unavailable" ? "Ownership check unavailable, try again" : (j.error || "Failed"));
  }

  useEffect(() => {
    const saved = readProof(name, PROOF_TTL_MS);
    if (!saved) return;
    setResumeReady(true);
    setBusy(true);
    setMsg("Finishing the signature you already approved…");
    verifyProof(saved)
      .catch((err) =>
        setMsg(
          err instanceof TimeoutError
            ? "Verification timed out. Your signature is saved — press Resume without signing again."
            : "Could not finish the last signature. Press Resume."
        )
      )
      .finally(() => setBusy(false));
    // verifyProof is intentionally not a dependency: it is re-created every render and this runs once per name.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  // Mobile wallets hand the result back when the tab regains focus. Say so instead of showing a frozen spinner.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      setMsg((m) => (m && m.startsWith("Waiting for your wallet") ? "Back in the app — waiting for the wallet to hand back the signature…" : m));
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  async function load() {
    if (busy) return;
    if (!publicKey || !signMessage) { setMsg("Connect a wallet that can sign messages"); return; }
    setBusy(true); setMsg(null); setNotOwner(false);
    const walletKey = publicKey.toBase58();
    try {
      const saved = readProof(name, PROOF_TTL_MS);
      if (saved) {
        setMsg("Finishing the signature you already approved…");
        await verifyProof(saved);
        return;
      }
      setMsg("Waiting for your wallet… approve the signature, then come back to this page.");
      const ts = Date.now();
      const pending = signMessage(new TextEncoder().encode(`teos://dashboard/${name}/${ts}`));
      // Mobile wallets can hand the signature back long after the request left the page. Capture it
      // whenever it arrives and finish the check, so a late answer never needs a second signature.
      let answered = false;
      pending.then(
        (value) => {
          if (answered) return;
          answered = true;
          const signature = signatureToBase64(value);
          if (!signature) {
            setMsg("The wallet returned no signature. Unlock the wallet, then press Sign in again.");
            return;
          }
          const proof: Proof = { name, ts, signature, publicKey: walletKey };
          saveProof(proof);
          setResumeReady(true);
          setMsg("Signature received. Verifying…");
          verifyProof(proof).catch((err) =>
            setMsg(
              err instanceof TimeoutError
                ? "Verification is taking too long. Your signature is saved — press Resume without signing again."
                : "Signature saved. Press Resume to finish."
            )
          );
        },
        () => {
          // Rejected by the user or failed in the wallet: the awaited path below reports it.
        }
      );
      await withTimeout(pending, SIGN_REQUEST_TIMEOUT_MS, "sign");
    } catch (e) {
      if (e instanceof TimeoutError) {
        setMsg("MetaMask has not handed the signature back to this page yet. If you already approved it, stay on this page: it finishes by itself as soon as the signature arrives. / لو وافقت، سيب الصفحة مفتوحة — هتكمل لوحدها أول ما التوقيع يوصل.");
      } else {
        setMsg("Signing cancelled or failed");
      }
    } finally {
      setBusy(false);
    }
  }

  // Price and availability always come from the server: /api/quote re-checks both, and /api/register re-checks on-chain ownership.
  async function quote() {
    if (!sel) return;
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain: name, tlds: sel.tld }) });
      const j = await r.json();
      if (!r.ok || j.error) setMsg(j.error === "registration_closed" ? "Registration is not open yet" : (j.error || "Quote unavailable"));
      else if (j.available === false) setMsg(`Not available: ${j.reason ?? ""}`);
      else setMintQuote(j); // MintModal pays exactly the server quote: pay_to and price_sol come from /api/quote, never from this page
    } catch { setMsg("Quote unavailable"); }
    setBusy(false);
  }

  const counts = rows ? { available: rows.filter((r) => r.status === "available").length, owned: rows.filter((r) => r.status === "owned").length, reserved: rows.filter((r) => r.status === "reserved").length } : null;

  return (
    <div className="mx-auto mt-6 max-w-5xl">
      <div className="flex justify-center"><WalletMultiButton /></div>
      {!rows && (
        <div className="mt-4 text-center">
          <button disabled={!publicKey || busy} onClick={load} style={{ background: "#ca8a04", color: "#000", padding: "12px 24px", fontWeight: 700 }}>
            {busy ? "Waiting for wallet…" : resumeReady ? "Resume without signing again" : `Sign in as owner of ${name}.teos`}
          </button>
        </div>
      )}
      {notOwner && <p className="mt-4 text-center">This wallet does not hold {name}.teos. {avail}</p>}
      {msg && <p className="mt-3 text-center">{msg}</p>}
      {rows && counts && (
        <>
          <p className="mt-4 text-center">{rows.length} namespaces for {name}: {counts.available} available, {counts.owned} owned, {counts.reserved} reserved</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10, marginTop: 16 }}>
            {rows.map((r) => (
              <button key={r.tld} disabled={r.status !== "available"} onClick={() => setSel(r)} aria-pressed={sel?.tld === r.tld}
                style={{ background: sel?.tld === r.tld ? "#ca8a04" : "#222", color: sel?.tld === r.tld ? "#000" : "#fff", padding: 12, border: `1px solid ${COLOR[r.status]}`, opacity: r.status === "available" ? 1 : 0.55, cursor: r.status === "available" ? "pointer" : "default", textAlign: "left" }}>
                {r.flag} {displayName(name, r.tld)}{needsBadge(r.tld) && <InsideTeos />}<br />${r.price_usd} - <span style={{ color: sel?.tld === r.tld ? "#000" : COLOR[r.status] }}>{r.status}</span>
              </button>
            ))}
          </div>
          <button disabled={!sel || busy} onClick={quote} style={{ background: "#ca8a04", color: "#000", padding: 15, width: "100%", marginTop: 20, fontSize: 18, fontWeight: 700 }}>
            {sel ? `Buy ${sel.domain} - $${sel.price_usd}` : "Select an available name"}
          </button>
        </>
      )}
      {mintQuote && <MintModal t={L} rtl={rtl} domain={name} quote={mintQuote} onClose={() => setMintQuote(null)} helpHref={SOCIAL.help} />}
    </div>
  );
}
