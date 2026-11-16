import { cleanName } from "../../../lib/domain";
import BuilderClient from "./BuilderClient";

export const dynamic = "force-dynamic";

export default async function BuilderPage({ params }: { params: Promise<{ name: string }> }) {
  const name = cleanName((await params).name);
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-center text-3xl font-bold" style={{ color: "gold", fontFamily: "Cinzel, Georgia, serif" }}>{`Design ${name.toUpperCase()}.TEOS`}</h1>
      <BuilderClient name={name} />
    </main>
  );
}
