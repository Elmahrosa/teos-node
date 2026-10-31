import { readFileSync } from 'fs'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, generateSigner } from '@metaplex-foundation/umi'
import { mplBubblegum, createTree, mintV1 } from '@metaplex-foundation/mpl-bubblegum'
import { mplToolbox, setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox'

const DOMAINS = ["AHLY.EG","ZAMALEK.EG","GOOGLE.EG","FACEBOOK.EG","VODAFONE.EG","ETISALAT.EG","ORANGE.EG","WE.EG","CIB.EG","NBE.EG","TALAAT-MOSTAFA.EG","SAWIRIS.EG","ELGEBALY.EG","AYMAN.EG"]

// استخدم RPC اسرع
const RPCS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana-rpc.publicnode.com'
]

let umi
for (const rpc of RPCS) {
  try {
    console.log('Trying RPC:', rpc)
    umi = createUmi(rpc)
    const walletData = JSON.parse(readFileSync('./wallet.json','utf8'))
    const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletData))
    umi.use(mplToolbox()).use(mplBubblegum()).use(keypairIdentity(keypair))
    const bal = await umi.rpc.getBalance(keypair.publicKey)
    console.log('Balance:', Number(bal.basisPoints)/1e9, 'SOL - RPC OK')
    break
  } catch(e) { console.log('RPC failed, next...') }
}

const merkleTree = generateSigner(umi)
console.log('Tree:', merkleTree.publicKey.toString())

try {
  // ارخص تري ممكن
  const builder = createTree(umi, {
    merkleTree,
    maxDepth: 5,
    maxBufferSize: 8,
    canopyDepth: 0,
  })
  builder.add(setComputeUnitLimit(umi, { units: 400000 }))
  
  console.log('Sending tree tx...')
  const res = await builder.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })
  console.log('✅ Tree Created! SIG:', res.signature.toString())
  console.log('Explorer: https://solscan.io/tx/' + res.signature.toString())

  await new Promise(r => setTimeout(r, 3000))

  for (let i=0; i<DOMAINS.length; i++){
    console.log(`Mint ${i+1}/${DOMAINS.length} ${DOMAINS[i]}`)
    const b = await mintV1(umi, {
      leafOwner: umi.identity.publicKey,
      merkleTree: merkleTree.publicKey,
      metadata: {
        name: DOMAINS[i],
        uri: `https://teos.eg/${DOMAINS[i]}`,
        sellerFeeBasisPoints: 0,
        collection: null,
        creators: [{ address: umi.identity.publicKey, verified: true, share: 100 }]
      }
    })
    b.add(setComputeUnitLimit(umi, { units: 400000 }))
    const r = await b.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })
    console.log('  -> Minted:', r.signature.toString().slice(0,20))
    await new Promise(r => setTimeout(r, 1000))
  }
  console.log('DONE ALL - Tree:', merkleTree.publicKey.toString())
} catch(e) {
  console.log('ERROR:', e.message)
  if (e.getLogs) {
    const logs = await e.getLogs()
    console.log('LOGS:', logs)
  }
  console.log('Full:', e)
}