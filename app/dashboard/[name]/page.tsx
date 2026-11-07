import { cleanName } from "../../../lib/domain";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Promise<{ name: string }> }) {
  const name = cleanName((await params).name);
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-center text-4xl font-bold" style={{ color: "gold", fontFamily: "Cinzel, Georgia, serif" }}>{`${name.toUpperCase()}.TEOS`}</h1>
      <DashboardClient name={name} />
    </main>
  );
}
