import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi'
import { updateV1 } from '@metaplex-foundation/mpl-core'
import bs58 from 'bs58'

const umi = createUmi('https://api.mainnet-beta.solana.com')

const PRIVATE_KEY_BASE58 = '478yH4urDbHNrVBX2UyPUykzY3TsEskH3MPAZDGCg64LKw85AMhs1VNnvnupipDfN3ZK5bWtSbBCjT6CXs9nsnw9'

const secret = bs58.decode(478yH4urDbHNrVBX2UyPUykzY3TsEskH3MPAZDGCg64LKw85AMhs1VNnvnupipDfN3ZK5bWtSbBCjT6CXs9nsnw9)
const keypair = umi.eddsa.createKeypairFromSecretKey(secret)
umi.use(keypairIdentity(keypair))

const asset = publicKey('C7DPJZegjbpfd2wJ3GQudWusnzEW6LJpQNWQKtKXBYji')
const newAuth = publicKey('FeuSA7hK2THKj3ndwvkFjYgx9BYbYczD49zafKV3GQcP')

const res = await updateV1(umi, { asset, newUpdateAuthority: newAuth }).sendAndConfirm(umi)
console.log('SUCCESS', res.signature)
