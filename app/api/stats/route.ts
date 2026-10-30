import { NextResponse } from "next/server";
import { getCharterState } from "../../../lib/teos";
import { priceFor } from "../../../lib/pricing";

export const dynamic = "force-dynamic";
export async function GET() {
  const s = await getCharterState();
  let early: any = {};
  try { const p = await priceFor("earlybird"); early = { total_minted: p.totalMinted, remaining: p.remaining, early_bird_price_sol: p.isEarlyBird ? p.priceSOL : null }; } catch {}
  return NextResponse.json({ spots_left: s.spots_left, spots_sold: s.spots_sold, total_spots: s.total_spots, charter_enabled: s.charter_enabled, charter_active: s.charter_active,
    registration_open: ["REGISTRATION_OPEN","REGISTRATION_ENABLED","NEXT_PUBLIC_REGISTRATION_OPEN","NEXT_PUBLIC_REGISTRATION_ENABLED"].some((k) => process.env[k]?.trim() === "true"),
    ...early,
    supply: 199,
    founders: ["AYMAN.TEOS", "ELMAHROSA.TEOS"],
    mints: ["C7DPJZegjbpfd2wJ3GQudWusnzEW6LJpQNWQKtKXBYji", "H7TajhCaofXSZ4MAsxmAArCet77yoAeWx878XaZDBDLN"],
  });
}
