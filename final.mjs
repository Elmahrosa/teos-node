import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore, updateV1 } from '@metaplex-foundation/mpl-core';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import bs58 from 'bs58';

const raw = (process.env.TEOS_KEY || '').trim();
if (!raw) throw new Error('TEOS_KEY is empty! Set it first');

const umi = createUmi('https://api.mainnet-beta.solana.com').use(mplCore());
const secretKey = bs58.decode(raw);
const kp = umi.eddsa.createKeypairFromSecretKey(secretKey);
umi.use(keypairIdentity(kp));

console.log('Owner:', kp.publicKey.toString());

console.log('--- Updating ELMAHROSA ---');
const tx1 = await updateV1(umi, {
  asset: publicKey('H7TajhCaofXSZ4MAsxmAArCet77yoAeWx878XaZDBDLN'),
  newUri: 'ipfs://bafkreid5qviaz37snnt2xo5mgcrs5ywz23me3zfmsf7yezdwd5pvbhap4i'
}).sendAndConfirm(umi);
console.log('✅ ELMAHROSA UPDATED! Sig:', tx1.signature);

console.log('--- Updating AYMAN ---');
const tx2 = await updateV1(umi, {
  asset: publicKey('C7DPJZegjbpfd2wJ3GQudWusnzEW6LJpQNWQKtKXBYji'),
  newUri: 'ipfs://bafkreiggzdm5jutmknajogr3fzm7hkauhu5hckuqcrfkwheowbiouyszce'
}).sendAndConfirm(umi);
console.log('✅ AYMAN UPDATED! Sig:', tx2.signature);

console.log('🎉 BOTH DONE! Check Solscan now!');
