import fs from 'fs'
import { Keypair } from '@solana/web3.js'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { publicKey } from '@metaplex-foundation/umi'
import pkg from '@metaplex-foundation/mpl-bubblegum'
const lib = pkg.default || pkg
const { mplBubblegum, fetchTreeConfigFromSeeds } = lib

const KEY_PATH = "C:\\Users\\aams1\\teos-fresh\\wallet.json"
const HELIUS = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_KEY}`

async function main(){
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(KEY_PATH,'utf8')))
  const umi = createUmi(HELIUS).use(mplBubblegum())
  const { publicKey: umiPub } = await import('@metaplex-foundation/umi')
  
  const trees = [
    "Bk7LekRCvMZferKLtnNTGUMZWD2fyDitenG7c3UDjvgL",
    "hYN2hgbQ36pFRvdo1dBLhfFV4LKNkhyu29XENpkMJZf"
  ]
  
  for(const t of trees){
    try{
      const config = await fetchTreeConfigFromSeeds(umi, { merkleTree: publicKey(t) })
      console.log(`شجرة ${t.slice(0,8)}...:`, "maxDepth", config.maxDepth, "numMinted", Number(config.numMinted), "totalMintCapacity", Number(config.totalMintCapacity))
    }catch(e){
      console.log(`شجرة ${t} فشل:`, e.message.slice(0,300))
    }
  }
}
main().catch(console.error)
