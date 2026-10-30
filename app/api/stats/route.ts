import { NextResponse } from "next/server";
import { getCharterState } from "../../../lib/teos";
import { getSoldCount } from "../../../lib/registry";
import { getSolUsd, PROMO_LIMIT, PROMO_USD, MARKET_USD } from "../../../lib/pricing";
export async function GET() {
  const s = await getCharterState();
  const sold = await getSoldCount().catch(() => null);
  const solUsd = await getSolUsd();
  return NextResponse.json({
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
