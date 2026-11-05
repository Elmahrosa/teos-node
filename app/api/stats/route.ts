import { NextResponse } from "next/server";
import { getSoldCount } from "../../../lib/registry";
import { TLDS } from "../../../lib/tlds";
import { mintFunds } from "../../../lib/mint";
import { getSolUsd, MARKET_USD } from "../../../lib/pricing";

export async function GET() {
  const sold = await getSoldCount().catch(() => null);
  const solUsd = await getSolUsd();
  const mint_ready = (await mintFunds(1)).ok;
  const tlds = await Promise.all(TLDS.map(async (t) => {
    const n = await getSoldCount(t.tld).catch(() => null);
    return { tld: t.tld, label: t.label, flag: t.flag, name: t.name, region: t.region, live: t.live, sold: n };
  }));
  return NextResponse.json({
    tlds,
    sold,
    market_usd: MARKET_USD,
    sol_usd: solUsd,
    registration_open: process.env.REGISTRATION_OPEN === "true",
    mint_ready,
    total_sold: tlds.reduce((a, t) => a + (t.sold ?? 0), 0),
    founders: ["AYMAN.TEOS", "ELMAHROSA.TEOS"],
    mints: ["C7DPJZegjbpfd2wJ3GQudWusnzEW6LJpQNWQKtKXBYji", "H7TajhCaofXSZ4MAsxmAArCet77yoAeWx878XaZDBDLN"],
  });
}