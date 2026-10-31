import { readFileSync } from 'fs'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, generateSigner } from '@metaplex-foundation/umi'
import { mplBubblegum, createTree, mintV1 } from '@metaplex-foundation/mpl-bubblegum'
import { mplToolbox } from '@metaplex-foundation/mpl-toolbox'

const DOMAINS = ["AHLY.EG","ZAMALEK.EG","GOOGLE.EG","FACEBOOK.EG","VODAFONE.EG","ETISALAT.EG","ORANGE.EG","WE.EG","CIB.EG","NBE.EG","TALAAT-MOSTAFA.EG","SAWIRIS.EG","ELGEBALY.EG","AYMAN.EG"]

const umi = createUmi('https://rpc.ankr.com/solana')
const walletData = JSON.parse(readFileSync('./wallet.json','utf8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletData))
umi.use(mplToolbox()).use(mplBubblegum()).use(keypairIdentity(keypair))

console.log('Wallet:', keypair.publicKey.toString())

const merkleTree = generateSigner(umi)
console.log('Tree:', merkleTree.publicKey.toString())

const builder = await createTree(umi, {
  merkleTree,
  maxDepth: 14,
  maxBufferSize: 64,
  canopyDepth: 0,
})

const res = await builder.sendAndConfirm(umi)
console.log('Tree SIG:', res.signature)

await new Promise(r => setTimeout(r, 2000))

for (let i=0;i<DOMAINS.length;i++){
  console.log(`Mint ${i+1}/${DOMAINS.length} ${DOMAINS[i]}`)
  const mintBuilder = await mintV1(umi, {
    leafOwner: keypair.publicKey,
    merkleTree: merkleTree.publicKey,
    metadata: {
      name: DOMAINS[i],
      uri: `https://teos.eg/${DOMAINS[i]}`,
      sellerFeeBasisPoints: 0,
      collection: null,
      creators: [{ address: keypair.publicKey, verified: true, share: 100 }]
    }
  })
  const r = await mintBuilder.sendAndConfirm(umi)
  console.log('SIG:', r.signature.slice(0,20))
}

console.log('DONE Tree:', merkleTree.publicKey.toString())