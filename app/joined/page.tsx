"use client";
import PageShell from "../../components/PageShell";
import JoinedSection from "../../components/JoinedSection";

export default function JoinedPage() {
  return <PageShell>{({ lang }) => <JoinedSection lang={lang} />}</PageShell>;
}
