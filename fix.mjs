import fs from 'fs'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi'

const RPC = "https://api.mainnet-beta.solana.com"
const KEYPAIR_PATH = "C:\\Users\\aams1\\teos-fresh\\wallet.json"

const TREES = [
  "hYN2hgxm8cJq2tK6Y7Qk9L...",
  "Bk7Lek..."
]
// حط هنا الـ assetIds الـ 22 اللي طلعت في check-dups
const ASSETS = [] // هتملاها من ناتج check-dups

async function main(){
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(KEYPAIR_PATH,'utf8')))
  const kp = Keypair.fromSecretKey(secret)
  console.log("محفظتك:", kp.publicKey.toBase58())
  const conn = new Connection(RPC)
  const bal0 = await conn.getBalance(kp.publicKey)
  console.log("رصيد قبل:", bal0/1e9)

  const umi = createUmi(RPC)
  umi.use(keypairIdentity({ publicKey: publicKey(kp.publicKey.toBase58()), secretKey: secret }))

  // هنا الحرق وبعده القفل - لو الشجرة مش فاضية مش هتتقفل وده أمان
}
main()