import { notFound } from "next/navigation";
import { cleanName } from "../../../lib/domain";
import { getSite } from "../../../lib/sites-store";
import SiteView from "../../../components/SiteView";

export const dynamic = "force-dynamic";

export default async function PublishedSite({ params }: { params: Promise<{ name: string }> }) {
  const name = cleanName((await params).name);
  const site = name ? await getSite(name).catch(() => null) : null;
  if (!site) notFound();
  return <SiteView name={name} site={site} />;
}
