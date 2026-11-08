"use client";
import PageShell from "../../components/PageShell";
import VisitorSection, { useVisitorStats, WorldTotals } from "../../components/VisitorSection";

export default function WorldPage() {
  const stats = useVisitorStats();
  return (
    <PageShell>
      {({ lang }) => (
        <>
          <VisitorSection stats={stats} lang={lang} h1 />
          <WorldTotals stats={stats} lang={lang} />
        </>
      )}
    </PageShell>
  );
}
