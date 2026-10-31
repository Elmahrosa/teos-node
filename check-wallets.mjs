import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import fs from 'fs'
import path from 'path'

const umi = createUmi('https://api.mainnet-beta.solana.com')

const files = [
  'C:\\Users\\aams1\\mint-authority.json',
  'C:\\Users\\aams1\\Desktop\\REAL_key_1.json',
  'C:\\Users\\aams1\\Desktop\\REAL_key_2.json',
  'C:\\Users\\aams1\\Desktop\\REAL_key_3.json',
  'C:\\Users\\aams1\\Desktop\\REAL_key_4.json',
  'C:\\Users\\aams1\\Desktop\\REAL_key_5.json',
  'C:\\Users\\aams1\\Desktop\\REAL_key_6.json',
]

for (const file of files) {
  try {
    const secret = JSON.parse(fs.readFileSync(file))
    const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret))
    console.log(`${path.basename(file)} => ${keypair.publicKey}`)
  } catch (e) {
    console.log(`${path.basename(file)} => ERROR: ${e.message}`)
  }
}
