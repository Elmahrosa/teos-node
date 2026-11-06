import { NextResponse } from "next/server";
import { getSoldCount } from "../../../lib/registry";
import { TLDS } from "../../../lib/tlds";
import { getSolUsd } from "../../../lib/pricing";
import { env } from "../../../lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const sold = await getSoldCount().catch(() => null);
  const solUsd = await getSolUsd();
  // Same condition as the /api/quote gate: open only when REGISTRATION_OPEN is exactly "true".
  const registrationOpen = env("REGISTRATION_OPEN") === "true";
  const mintReady = registrationOpen && !!env("MINT_AUTHORITY_KEYPAIR") && !!env("COLLECTION_ADDRESS");

  const tlds = await Promise.all(
    TLDS.map(async (t) => {
      const n = await getSoldCount(t.tld).catch(() => null);
      return {
        tld: t.tld,
        label: t.label,
        flag: t.flag,
        name: t.name,
        region: t.region,
        live: t.live,
        sold: n,
      };
    })
  );

  return NextResponse.json({
    tlds,
    sold,
    sol_usd: solUsd,
    registration_open: registrationOpen,
    mint_ready: mintReady,
    total_sold: tlds.reduce((a, t) => a + (t.sold ?? 0), 0),
    founders: ["AYMAN.TEOS", "ELMAHROSA.TEOS"],
    mints: [
      "C7DPJZegjbpfd2wJ3GQudWusnzEW6LJpQNWQKtKXBYji",
      "H7TajhCaofXSZ4MAsxmAArCet77yoAeWx878XaZDBDLN",
    ],
  });
}
