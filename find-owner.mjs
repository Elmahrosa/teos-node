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
  'C:\\Users\\aams1\\Desktop\\NEW.json',
]
console.log('Searching for owner 3jDz3r9Vpx...')
for (const f of files) {
  try {
    const s = JSON.parse(fs.readFileSync(f))
    const kp = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(s))
    console.log(`${path.basename(f)} => ${kp.publicKey}`)
    if (kp.publicKey == '3jDz3r9VpxXhCnnRpZ2wXQxpprQDNGT2XpL6knGLzG') {
      console.log(`*** FOUND! THIS IS YOUR MAIN WALLET: ${f} ***`)
    }
  } catch (e) {
    console.log(`${path.basename(f)} => ERROR`)
  }
}
