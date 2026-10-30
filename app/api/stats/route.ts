import { NextResponse } from "next/server";
import { getCharterState } from "../../../lib/teos";
import { getSoldCount } from "../../../lib/registry";
import { TLDS } from "../../../lib/tlds";
import { getSolUsd, PROMO_LIMIT, PROMO_USD, MARKET_USD } from "../../../lib/pricing";
export async function GET() {
  const s = await getCharterState();
  const sold = await getSoldCount().catch(() => null);
  const solUsd = await getSolUsd();
  const tlds = await Promise.all(TLDS.map(async (t) => {
    const n = await getSoldCount(t.tld).catch(() => null);
    return { tld: t.tld, label: t.label, flag: t.flag, live: t.live, sold: n, promo_limit: t.promo_limit, promo_left: n === null ? null : Math.max(0, t.promo_limit - n), promo_usd: t.promo_usd };
  }));
  return NextResponse.json({
    tlds,
    sold,
    promo_limit: PROMO_LIMIT,
    promo_left: sold === null ? null : Math.max(0, PROMO_LIMIT - sold),
    promo_usd: PROMO_USD,
    market_usd: MARKET_USD,
    sol_usd: solUsd, spots_left: s.spots_left, spots_sold: s.spots_sold, total_spots: s.total_spots, charter_enabled: s.charter_enabled, charter_active: s.charter_active,
    registration_open: process.env.REGISTRATION_OPEN === "true",
    total_minted: 2,
    supply: 199,
    founders: ["AYMAN.TEOS", "ELMAHROSA.TEOS"],
    mints: ["C7DPJZegjbpfd2wJ3GQudWusnzEW6LJpQNWQKtKXBYji", "H7TajhCaofXSZ4MAsxmAArCet77yoAeWx878XaZDBDLN"],
  });
}
