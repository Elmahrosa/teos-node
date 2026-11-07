import Link from "next/link";
import { cleanName } from "../../../lib/domain";
import { remainingCountries } from "../../../lib/countries";

export const dynamic = "force-dynamic";

export default async function FounderSite({ params }: { params: Promise<{ name: string }> }) {
  const name = cleanName((await params).name);
  const countries = await remainingCountries(name);
  return (
    <main className="min-h-screen p-6 text-center">
      <h1 className="text-4xl font-bold" style={{ color: "gold", fontFamily: "Cinzel, Georgia, serif" }}>{`${name.toUpperCase()}.TEOS`}</h1>
      <p className="mt-3 text-xl">YOU OWN IT</p>
      <Link href={`/dashboard/${name}`} style={{ display: "inline-block", marginTop: 16, background: "#ca8a04", color: "#000", padding: "12px 24px", fontWeight: 700 }}>
        Open dashboard - buy {name} in any country
      </Link>
      <section id="founder-countries" className="mx-auto mt-8 max-w-3xl border border-yellow-600 p-4">
        <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, listStyle: "none", padding: 0 }}>
          {countries.map((c) => (
            <li key={c.tld} data-country={c.tld} className="border border-yellow-800 p-3">
              {c.flag} {name}.{c.tld}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
