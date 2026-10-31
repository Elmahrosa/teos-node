import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createV1 } from '@metaplex-foundation/mpl-core'
import { keypairIdentity, generateSigner, publicKey } from '@metaplex-foundation/umi'
import fs from 'fs'

const OWNER = publicKey('3jDzyu8Y1p2d3a4b5c6d7e8f9g0h1i2j3k4l5m6n7GLzG')

const DOMAINS_14 = [
  'AYMAN.EG','AYMAN.SA','AYMAN.AE','AYMAN.QA','AYMAN.KW','AYMAN.BH','AYMAN.OM',
  'ELMAHROSA.EG','ELMAHROSA.SA','ELMAHROSA.AE','ELMAHROSA.QA','ELMAHROSA.KW','ELMAHROSA.BH','ELMAHROSA.OM'
]

const umi = createUmi('https://api.mainnet-beta.solana.com')
const secret = JSON.parse(fs.readFileSync('./wallet.json'))
umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret))))

for (const name of DOMAINS_14) {
  console.log(`Minting ${name}...`)
  const asset = generateSigner(umi)
  await createV1(umi, {
    asset,
    name: name,
    uri: `https://web4.elmahrosa.org/metadata/${name.toLowerCase()}.json`,
  }).sendAndConfirm(umi)
  console.log(`SEALED: ${name} -> ${asset.publicKey}`)
}
console.log('ALL 14 FOUNDER DOMAINS SEALED - ELM-INT-WEB4-001')