import fs from 'fs'
import { Keypair } from '@solana/web3.js'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi'
import pkg from '@metaplex-foundation/mpl-bubblegum'
const lib = pkg.default || pkg
const { mplBubblegum, getAssetWithProof, burn } = lib

const KEY_PATH = "C:\\Users\\aams1\\teos-fresh\\wallet.json"
const HELIUS = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_KEY}`

const IDS = [
  "KC92uHzKg1uMj1AWKq74yhwvFNaivkf55Lx7WuxJkpb","3J45n8ZV5rN6ryMVS58Bd7N9pkiSZ83maVgFS652RV7P","3ZZvZGEmXAaMKLphB6J5MDQpejVWLVEbLi9idyd7RXmJ","3tQNvFfq8i7bqyELURfGHrMbodt6LeMqafkX6tiqpLbY","49x7AqU7Y32k9Vf4kZsqEKQSpiK1KhPFag9QjvfTcssw","5QhpJx7BqbBYNC1usNt8EEVXUG3X7GzX8qFHNUippe2s","7Q8gCosJ7Jv5x9rNLhKr5RDQX4ZHr1xRKn6SFRfyP828","89Wkx6TtXYmVjQZLDY6yFVDU9d7vYTjdCwsLesxSQjhW","8PNSikS2Q3LpBW4uMk4A3kLmnnJQpZ6AcKLxvKKbAr6V","9Hic5fdh3ZVw4bzWngoyMUejQNUf6RZeGaqqu1muHo2F","9i7nuQuz3CFw71iBrjU6dyeHZpX1sURNrsBAdHqhmYZ7","A7U9C5SnVgZ8JqRpfXwW6gPczMNBJqjzD3aS48Bak7VJ","ALqh16i3dEUqG4G7EYy49fs6dGUe3QwGZ3pHsYPEgtuw","AhuUyNXDKtgQ7dk9XUb1LCvdTKNg4vEAkFHm3PUCCH3c","BMRpJKsTdyaCfnpqMdk1YbGtaPZ1MELAy3xQypcc8SvY","BX7BN47oBgP9Nzecdb5eGagvb5BgwropgiE4i1MPM3BU","BihDusiwex3k3ujLHdpCTCEyohCbuR8dnUPFyGejzUjS","CPbuqLDQzn5nn4GckkPCripEuuiN938P9MzT9zcmT43m","CSt5qShsLRBKW45N3Uydp9DRdSwabqDZehvkrZYcXypx","FEwPY6LaMvZo5wt5rjV5u3MgtKt8dt12YFtxGN8A519d","HajK64CszM7QtVfVqb6qBTBF3NuUX4o9P2kfBQ7bjX9j","HjtXEBwz8if2YyMdspV2PNwXJouyHBLgXc7fwLVkA9cP"
]

async function main(){
  const secret = new Uint8Array(JSON.parse(fs.readFileSync(KEY_PATH,'utf8')))
  const umi = createUmi(HELIUS).use(mplBubblegum())
  const umiKp = umi.eddsa.createKeypairFromSecretKey(secret)
  umi.use(keypairIdentity(umiKp))
  console.log("محفظتك:", umi.identity.publicKey.toString(), "- بستخدم burn V1")

  for(const id of IDS){
    try{
      console.log(`\nبجيب proof لـ ${id.slice(0,10)}...`)
      const assetWithProof = await getAssetWithProof(umi, publicKey(id))
      console.log(`  index ${assetWithProof.leafIndex} - بحرق...`)
      await burn(umi, {
        ...assetWithProof,
        leafOwner: umi.identity.publicKey
      }).sendAndConfirm(umi, { send: { commitment: "confirmed" } })
      console.log("  ✅ اتحرق")
    }catch(e){
      console.log(`  ❌ فشل:`, e.message.slice(0,600))
    }
  }
  console.log("\nخلص")
}
main().catch(console.error)
