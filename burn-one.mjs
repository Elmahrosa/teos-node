import fs from 'fs'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi'
import pkg from '@metaplex-foundation/mpl-bubblegum'
const lib = pkg.default || pkg
const { mplBubblegum, getAssetWithProof, burn } = lib

const KEY_PATH = "C:\\Users\\aams1\\teos-fresh\\wallet.json"
const HELIUS = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_KEY}`

async function main(){
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(KEY_PATH,'utf8')))
  const umi = createUmi(HELIUS).use(mplBubblegum())
  const kp = umi.eddsa.createKeypairFromSecretKey(secret)
  umi.use(keypairIdentity(kp))
  console.log("محفظتك:", kp.publicKey.toString())

  // خد اول واحد بس للتجربة
  const id = "3J45n8ZV5rN6ryMVS58Bd7N9pkiSZ83maVgFS652RV7P"
  console.log("بجيب proof لـ", id)
  const ap = await getAssetWithProof(umi, publicKey(id))
  console.log("keys:", Object.keys(ap))
  console.log("leafIndex:", ap.leafIndex, "nonce:", ap.nonce, "root:", ap.root?.toString().slice(0,20))
  console.log("proof len:", ap.proof?.length)
  console.log("بحرق...")
  const sig = await burn(umi, {
    ...ap,
    leafOwner: umi.identity.publicKey,
  }).sendAndConfirm(umi)
  console.log("✅ اتحرق فعلا! sig:", Buffer.from(sig.signature).toString('hex').slice(0,20))
}
main().catch(e=>{ console.error("❌", e); if(e.getLogs) e.getLogs().then(l=>console.log(l.join("\n")) ) })
