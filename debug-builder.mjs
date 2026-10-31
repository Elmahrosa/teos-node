import { readFileSync } from 'fs'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, generateSigner } from '@metaplex-foundation/umi'
import { mplBubblegum, createTree } from '@metaplex-foundation/mpl-bubblegum'
import { mplToolbox } from '@metaplex-foundation/mpl-toolbox'

const umi = createUmi('https://api.mainnet-beta.solana.com')
const walletData = JSON.parse(readFileSync('./wallet.json','utf8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletData))
umi.use(mplToolbox()).use(mplBubblegum()).use(keypairIdentity(keypair))

const merkleTree = generateSigner(umi)

const builder = await createTree(umi, {
  merkleTree,
  maxDepth: 14,
  maxBufferSize: 64,
  canopyDepth: 0,
})

console.log('TYPE:', typeof builder)
console.log('KEYS:', Object.keys(builder))
console.log('PROTO:', Object.getOwnPropertyNames(Object.getPrototypeOf(builder)))
console.log('BUILDER:', builder)
console.log('createTree toString:', createTree.toString().slice(0,800))
