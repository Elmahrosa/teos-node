"use client";
import InfoShell from "../../components/InfoShell";

export default function Privacy() {
  return (
    <InfoShell>
      {(t) => (
        <>
          <h1 style={{ fontFamily: "Cinzel, Georgia, serif", color: "#fef3c7", marginTop: 0 }}>{t.privTitle}</h1>
          <p>{t.priv1}</p><p>{t.priv2}</p><p>{t.priv3}</p>
        </>
      )}
    </InfoShell>
  );
}
