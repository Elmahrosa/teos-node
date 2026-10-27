 import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplCore, fetchAsset, update } from '@metaplex-foundation/mpl-core'
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi'
import bs58 from 'bs58'

const umi = createUmi('https://api.mainnet-beta.solana.com').use(mplCore())
const secret = bs58.decode(process.env.TEOS_KEY)
umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(secret)))

if (umi.identity.publicKey.toString() !== 'F1YLmukcxAyZj6zVpi2XaVctmYnuZQB5uHpd3uUpXxr6') {
  throw new Error('Wrong wallet: ' + umi.identity.publicKey)
}

const asset = await fetchAsset(umi, publicKey('C7DPJZegjbpfd2wJ3GQudWusnzEW6LJpQNWQKtKXBYji'))
console.log('Owner:', asset.owner)
console.log('Update authority:', asset.updateAuthority)
console.log('Current URI:', asset.uri)

await update(umi, {
  asset,
  newUri: 'https://web4.elmahrosa.org/ayman.teos.json',
}).sendAndConfirm(umi)
console.log('Done')