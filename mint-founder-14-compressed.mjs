import { readFileSync } from 'fs'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, generateSigner } from '@metaplex-foundation/umi'
import { createTree, mintV1, fetchTreeConfigFromSeeds } from '@metaplex-foundation/mpl-bubblegum'

const DOMAINS = [
  "AHLY.EG","ZAMALEK.EG","GOOGLE.EG","FACEBOOK.EG","VODAFONE.EG",
  "ETISALAT.EG","ORANGE.EG","WE.EG","CIB.EG","NBE.EG",
  "TALAAT-MOSTAFA.EG","SAWIRIS.EG","ELGEBALY.EG","AYMAN.EG"
]

const umi = createUmi('https://api.mainnet-beta.solana.com')
const walletData = JSON.parse(readFileSync('./wallet.json','utf8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletData))
umi.use(keypairIdentity(keypair))

console.log('🚀 STARTING COMPRESSED MINT - 14 DOMAINS FOR 1 CENT')
console.log('Wallet:', keypair.publicKey)

const merkleTree = generateSigner(umi)
console.log('Creating Merkle Tree:', merkleTree.publicKey+'...')

await createTree(umi, {
  merkleTree,
  maxDepth: 14,
  maxBufferSize: 64,
}).sendAndConfirm(umi)

console.log('Tree created! Waiting 3 sec...')
await new Promise(r => setTimeout(r, 3000))

for (let i=0; i<DOMAINS.length; i++) {
  const name = DOMAINS[i]
  console.log(`Minting ${i+1}/14: ${name}...`)
  await mintV1(umi, {
    leafOwner: keypair.publicKey,
    merkleTree: merkleTree.publicKey,
    metadata: {
      name: name,
      uri: `https://teos.eg/${name}`,
      sellerFeeBasisPoints: 0,
      collection: null,
      creators: [{ address: keypair.publicKey, verified: true, share: 100 }],
    }
  }).sendAndConfirm(umi)
  console.log(`✅ SEALED: ${name}`)
}

console.log('🎉 ALL 14 DONE!')
console.log('Tree:', merkleTree.publicKey)
