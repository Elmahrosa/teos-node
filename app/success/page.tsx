"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import InsideTeos from "../../components/InsideTeos";
import InfoShell from "../../components/InfoShell";

// Query params are attacker-controlled: only well-formed values are shown or put into links.
const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,100}$/;
const pick = (v: string | null) => (v && B58.test(v) ? v : "");
const NAMES = /^[A-Za-z0-9.,\- ]{1,200}$/;

const a: React.CSSProperties = { color: "#eab308", wordBreak: "break-all" };

function Body() {
  const q = useSearchParams();
  const tx = pick(q.get("tx"));
  const pay = pick(q.get("pay"));
  const asset = pick(q.get("asset"));
  const rawNames = q.get("names") ?? "";
  const names = NAMES.test(rawNames) ? rawNames : "";
  const pending = q.get("pending") === "1";
  return (
    <InfoShell>
      {(t) => !tx ? <p>{t.sucMissing}</p> : (
        <>
          <h1 style={{ fontFamily: "Cinzel, Georgia, serif", color: "#fef3c7", marginTop: 0 }}>{t.sucTitle}</h1>
          {names && <p dir="ltr" style={{ fontSize: 20, fontWeight: 700 }}>{names.split(/[, ]*\+[, ]*|,/).filter(Boolean).map((n) => (<span key={n} style={{ marginInlineEnd: 10 }}>{n}{!n.endsWith(".teos") && <InsideTeos t={t} />}</span>))}</p>}
          {pending && <p style={{ color: "#fbbf24" }}>{t.sucPending}</p>}
          {asset && <p>{t.sucAsset}: <code dir="ltr" style={{ wordBreak: "break-all" }}>{asset}</code><br /><a style={a} href={`https://solscan.io/token/${asset}`} target="_blank" rel="noopener noreferrer">{t.sucViewAsset}</a></p>}
          <p>{t.sucTx}: <code dir="ltr" style={{ wordBreak: "break-all" }}>{pay || tx}</code><br /><a style={a} href={`https://solscan.io/tx/${pay || tx}`} target="_blank" rel="noopener noreferrer">{t.sucViewTx}</a></p>
          {!pending && <p style={{ color: "#a89a80" }}>{t.sucWallet}</p>}
        </>
      )}
    </InfoShell>
  );
}

export default function Success() {
  return <Suspense><Body /></Suspense>;
}