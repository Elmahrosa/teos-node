import { NextResponse } from "next/server";
import { getCharterState } from "../../../lib/teos";
export async function GET() {
  const s = await getCharterState();
  return NextResponse.json({ spots_left: s.spots_left, spots_sold: s.spots_sold, total_spots: s.total_spots, charter_enabled: s.charter_enabled, charter_active: s.charter_active,
    registration_open: process.env.REGISTRATION_OPEN === "true",
    total_minted: 2,
    supply: 199,
    founders: ["AYMAN.TEOS", "ELMAHROSA.TEOS"],
    mints: ["C7DPJZegjbpfd2wJ3GQudWusnzEW6LJpQNWQKtKXBYji", "H7TajhCaofXSZ4MAsxmAArCet77yoAeWx878XaZDBDLN"],
  });
}
