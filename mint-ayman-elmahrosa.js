 import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createV1 } from '@metaplex-foundation/mpl-core'
import { keypairIdentity, generateSigner } from '@metaplex-foundation/umi'
import fs from 'fs'

const umi = createUmi('https://api.mainnet-beta.solana.com')

// بيقرا wallet.json اللي انت عملته
const walletBytes = JSON.parse(fs.readFileSync('wallet.json'))
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletBytes))
umi.use(keypairIdentity(keypair))

console.log("محفظتك:", keypair.publicKey.toString())

async function mint(name) {
  console.log(`\n-> بعمل Mint لـ ${name}...`)
  const asset = generateSigner(umi)
  const result = await createV1(umi, {
    asset,
    name: name,
    uri: `https://web4.elmahrosa.org/${name.toLowerCase()}.json`,
  }).sendAndConfirm(umi)
  console.log(`✅ ${name} DONE!`)
  console.log(`   Tx: https://solscan.io/tx/${result.signature}`)
  console.log(`   Asset: ${asset.publicKey}`)
  return result.signature
}

async function run() {
  console.log("🔱 TEOS - AYMAN + ELMAHROSA ONLY")
  await mint("AYMAN.TEOS")
  await mint("ELMAHROSA.TEOS")
  console.log("\n👑 خلصوا - الاتنين بقوا On-Chain!")
}

run().catch(e => {
  console.error("❌ Error:", e)
})