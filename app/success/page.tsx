"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import InfoShell from "../../components/InfoShell";

const a: React.CSSProperties = { color: "#eab308", wordBreak: "break-all" };

function Body() {
  const q = useSearchParams();
  const tx = q.get("tx") ?? "";
  const pay = q.get("pay") ?? "";
  const asset = q.get("asset") ?? "";
  const names = q.get("names") ?? "";
  const pending = q.get("pending") === "1";
  return (
    <InfoShell>
      {(t) => !tx ? <p>{t.sucMissing}</p> : (
        <>
          <h1 style={{ fontFamily: "Cinzel, Georgia, serif", color: "#fef3c7", marginTop: 0 }}>{t.sucTitle}</h1>
          {names && <p dir="ltr" style={{ fontSize: 20, fontWeight: 700 }}>{names}</p>}
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
