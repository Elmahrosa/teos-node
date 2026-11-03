import { NextResponse } from "next/server";

export async function GET(
  _req: Request, 
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;
  const n = (name || "unknown").toLowerCase();
  
  return NextResponse.json({
    sovereign: n,
    root: ".teos",
    status: "SOVEREIGN_RESOLVED",
    ownership: "Metaplex Core - Solana Mainnet - Eternal - No Renewal",
    alexandria: "From El Mahrosa - Site 022 - Ayman Seif",
    rule: "1 Key unlocks 125 - .teos is the Golden Root",
    message: `${n} is a sovereign coordinate - Eternal ownership on Solana`,
    gateway: "https://web4.elmahrosa.org",
    explorer: `https://web4.elmahrosa.org`,
    timestamp: new Date().toISOString(),
    founder: "AYMAN.TEOS + ELMAHROSA.TEOS - Mainnet Assets"
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}