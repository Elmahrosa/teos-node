"use client";
import InfoShell from "../../components/InfoShell";

export default function Terms() {
  return (
    <InfoShell>
      {(t) => (
        <>
          <h1 style={{ fontFamily: "Cinzel, Georgia, serif", color: "#fef3c7", marginTop: 0 }}>{t.termsTitle}</h1>
          <p>{t.terms1}</p><p>{t.terms2}</p><p>{t.terms3}</p><p>{t.terms4}</p>
        </>
      )}
    </InfoShell>
  );
}
