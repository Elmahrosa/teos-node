import Link from "next/link";
import { cleanName } from "../../../lib/domain";
import { remainingCountries } from "../../../lib/countries";
import { isClaimed } from "../../../lib/registry";
import { ownsTeosOnChain } from "../../../lib/ownership";
import { isNotForSaleDomain, isReservedWord } from "../../../lib/domain-rules";
import { isSealedDomain } from "../../../lib/sealed";

export const dynamic = "force-dynamic";

// P0-2: ownership is never assumed. A visitor only sees "YOU OWN IT" when the wallet in
// ?wallet= actually holds this exact .teos on-chain. No wallet, no RPC, or another wallet
// means not owned. The name is still shown as registered/available from the registry.
export default async function FounderSite({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ wallet?: string }>;
}) {
  const name = cleanName((await params).name);
  const wallet = ((await searchParams).wallet ?? "").trim();
  const countries = await remainingCountries(name);

  const registered = await isClaimed(name).catch(() => false);
  const owns = !!wallet && registered && (await ownsTeosOnChain(wallet, name).catch(() => null)) === true;
  const reserved = isNotForSaleDomain(name) || isReservedWord(name) || isSealedDomain(name);

  const status = owns
    ? "YOU OWN IT"
    : registered
      ? "REGISTERED — NOT IN THIS WALLET"
      : reserved
        ? "RESERVED"
        : "AVAILABLE";

  return (
    <main className="min-h-screen p-6 text-center">
      <h1 className="text-4xl font-bold" style={{ color: "gold", fontFamily: "Cinzel, Georgia, serif" }}>{`${name.toUpperCase()}.TEOS`}</h1>
      <p className="mt-3 text-xl">{status}</p>

      {owns ? (
        <Link href={`/dashboard/${name}`} style={{ display: "inline-block", marginTop: 16, background: "#ca8a04", color: "#000", padding: "12px 24px", fontWeight: 700 }}>
          Open dashboard - buy {name} in any country
        </Link>
      ) : reserved ? (
        <p style={{ marginTop: 16, opacity: 0.8 }}>This name is reserved and cannot be bought.</p>
      ) : (
        <Link href="/#search" style={{ display: "inline-block", marginTop: 16, background: "#ca8a04", color: "#000", padding: "12px 24px", fontWeight: 700 }}>
          {registered ? `Check ${name}.teos` : `Buy ${name}.teos`}
        </Link>
      )}

      {owns && (
        <section id="founder-countries" className="mx-auto mt-8 max-w-3xl border border-yellow-600 p-4">
          <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, listStyle: "none", padding: 0 }}>
            {countries.map((c) => (
              <li key={c.tld} data-country={c.tld} className="border border-yellow-800 p-3">
                {c.flag} {name}.{c.tld}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
