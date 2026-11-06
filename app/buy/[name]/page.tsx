import { cleanName } from "../../../lib/domain";
import { remainingCountries } from "../../../lib/countries";
import BuyClient from "./BuyClient";

export const dynamic = "force-dynamic";

export default async function BuyPage({ params }: { params: Promise<{ name: string }> }) {
  const name = cleanName((await params).name);
  const countries = await remainingCountries(name);
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-center text-4xl font-bold" style={{ color: "gold", fontFamily: "Cinzel, Georgia, serif" }}>{`${name.toUpperCase()}.TEOS`}</h1>
      <p className="mt-3 text-center text-xl">Your page is open - choose your country</p>
      <BuyClient name={name} countries={countries.map((c) => ({ tld: c.tld, flag: c.flag }))} />
    </main>
  );
}
