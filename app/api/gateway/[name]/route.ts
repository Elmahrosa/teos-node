import { NextResponse } from "next/server";
export async function GET(_:Request,{params}:{params:{name:string}}){
  const n=params.name.toLowerCase();
  return NextResponse.json({
    sovereign: n,
    root: ".teos",
    status: "SOVEREIGN_RESOLVED",
    ownership: "Metaplex Core - Solana Mainnet - Eternal - No Renewal",
    alexandria: "From El Mahrosa - Site 022 - Ayman Seif",
    rule: "1 Key unlocks 125 - .teos unlocks eg/sa/us/ae",
    message: `${n} is a sovereign coordinate - Eternal ownership`,
    gateway: "https://web4.elmahrosa.org",
    explorer: `https://solscan.io/address/${n}`
  });
}