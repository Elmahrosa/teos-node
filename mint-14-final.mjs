import { readFileSync } from 'fs'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, generateSigner } from '@metaplex-foundation/umi'
import { mplBubblegum, createTree, mintV1 } from '@metaplex-foundation/mpl-bubblegum'
import { mplToolbox } from '@metaplex-foundation/mpl-toolbox'

// الـ 14 النهائيين بتوعك
const FINAL_14 = [
  "AYMAN.EG", "AYMAN.SA", "AYMAN.AE", "AYMAN.QA", "AYMAN.KW", "AYMAN.BH", "AYMAN.OM",
  "ELMAHROSA.EG", "ELMAHROSA.SA", "ELMAHROSA.AE", "ELMAHROSA.QA", "ELMAHROSA.KW", "ELMAHROSA.BH", "ELMAHROSA.OM"
]

const umi = createUmi('https://api.mainnet-beta.solana.com')
const walletData = JSON.parse(readFileSync('./wallet.json','utf8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletData))
umi.use(mplToolbox()).use(mplBubblegum()).use(keypairIdentity(keypair))

const bal = await umi.rpc.getBalance(keypair.publicKey)
console.log('Balance:', Number(bal.basisPoints)/1e9, 'SOL')
console.log('Final 14:', FINAL_14)

const merkleTree = generateSigner(umi)
console.log('New Premium Tree:', merkleTree.publicKey.toString())

const builder = await createTree(umi, {
  merkleTree,
  maxDepth: 5,
  maxBufferSize: 8, // 32 مكان - يكفي 14 بالظبط
})

console.log('Creating Premium Tree for AYMAN & ELMAHROSA...')
const res = await builder.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })
console.log('✅ Premium Tree Created:', res.signature.toString())
console.log('Tree Address:', merkleTree.publicKey.toString())

await new Promise(r => setTimeout(r, 2000))

for (let i=0; i<FINAL_14.length; i++){
  const domain = FINAL_14[i]
  console.log(`\n[${i+1}/14] Mint ${domain}`)
  
  let retries = 0
  let minted = false
  while(!minted && retries < 5){
    try {
      const b = await mintV1(umi, {
        leafOwner: umi.identity.publicKey,
        merkleTree: merkleTree.publicKey,
        metadata: {
          name: domain,
          uri: `https://teos.eg/${domain}`,
          sellerFeeBasisPoints: 0,
          collection: null,
          creators: [{ address: umi.identity.publicKey, verified: true, share: 100 }]
        }
      })
      const r = await b.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })
      console.log(`✅ ${domain} DONE`)
      minted = true
    } catch(e){
      retries++
      const msg = e.message || ''
      if (msg.includes('429') || msg.includes('blockhash') || msg.includes('fetch failed')) {
        console.log(`⏳ 429 - نوم 4 ثواني retry ${retries}/5`)
        await new Promise(r => setTimeout(r, 4000))
      } else {
        console.log('❌ Error:', msg.slice(0,100))
        await new Promise(r => setTimeout(r, 4000))
      }
    }
  }
  // الحل اللي انت اكتشفته - 4 ثواني بين كل واحد
  await new Promise(r => setTimeout(r, 4000))
}

console.log('\n🎉🎉🎉 DONE ALL 14 PREMIUM!')
console.log('Tree:', merkleTree.publicKey.toString())
console.log('AYMAN x7 + ELMAHROSA x7 = SECURED')