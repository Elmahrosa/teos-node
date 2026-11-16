import { notFound } from "next/navigation";
import { cleanName } from "../../../lib/domain";
import { getSite, isSiteStoreUnavailable } from "../../../lib/sites-store";
import type { StoredSite } from "../../../lib/sites";
import SiteView from "../../../components/SiteView";

export const dynamic = "force-dynamic";

export default async function PublishedSite({ params }: { params: Promise<{ name: string }> }) {
  const name = cleanName((await params).name);
  let site: StoredSite | null;
  try {
    site = name ? await getSite(name) : null;
  } catch (err) {
    if (!isSiteStoreUnavailable(err)) throw err;
    // Store outage is not a missing site: show an error instead of a misleading 404.
    return (
      <main className="min-h-screen p-6" style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: "Cinzel, Georgia, serif", color: "gold" }}>Site temporarily unavailable</h1>
        <p>We could not reach the site store. Please try again in a moment.</p>
      </main>
    );
  }
  if (!site) notFound();
  return <SiteView name={name} site={site} />;
}
