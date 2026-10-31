 import { readFileSync } from 'fs'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi'
import { mplBubblegum, mintV1 } from '@metaplex-foundation/mpl-bubblegum'
import { mplToolbox } from '@metaplex-foundation/mpl-toolbox'

const umi = createUmi('https://api.mainnet-beta.solana.com')
const walletData = JSON.parse(readFileSync('./wallet.json','utf8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletData))
umi.use(mplToolbox()).use(mplBubblegum()).use(keypairIdentity(keypair))

const tree = publicKey('Bk7LekRCvMZferKLtnNTGUMZWD2fyDitenG7c3UDjvgL')
const domain = 'ELMAHROSA.OM'

console.log(`Mint last one: ${domain} to ${tree}`)
let tries = 0
while(tries < 20){
  try {
    const b = await mintV1(umi, {
      leafOwner: umi.identity.publicKey,
      merkleTree: tree,
      metadata: {
        name: domain,
        uri: `https://teos.eg/${domain}`,
        sellerFeeBasisPoints: 0,
        collection: null,
        creators: [{ address: umi.identity.publicKey, verified: true, share: 100 }]
      }
    })
    const r = await b.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })
    console.log(`🎉 ✅ ${domain} DONE!`)
    console.log(`SIG: ${r.signature}`)
    console.log('\n🎉🎉🎉 ALL 14 SECURED! AYMAN x7 + ELMAHROSA x7')
    break
  } catch(e){
    tries++
    console.log(`⏳ retry ${tries}/20 - ${e.message.slice(0,80)} - wait 5s`)
    await new Promise(r => setTimeout(r, 5000))
  }
}