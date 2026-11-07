import fs from 'fs';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore } from '@metaplex-foundation/mpl-core';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import { transferV1 } from '@metaplex-foundation/mpl-core';

const NEW_OWNER = 'FeuSA7hK2THkJ3ndvwkFjYgx9BYbYczD49zafKV3GQcP';
const umi = createUmi('https://api.mainnet-beta.solana.com').use(mplCore());
const secret = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));
const kp = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
umi.use(keypairIdentity(kp));
console.log('from:', kp.publicKey.toString());

const list = [
  ['AYMAN.BH','BMrPjKsTdyaCfnpqMdk1YbGtaPZ1MELAy3xQypcc85vY'],
  ['AYMAN.QA','BX7BN47oBgP9Nzecdb5EGagvb5BgwropgiEUi1MPM3BU'],
  ['AYMAN.KW','BihDusiwex3k3ujLHdpCTEyohCubR8dnUPFyGejzjUjS'],
  ['FACEBOOK.EG','CPbuqLDQzn5jn4GckkPCripEuuin938P9M7z9zcmT43m'],
  ['ELMAHROSA.SA','C5t5qGshsLRBkW45N3Uydp9DRdSwabqD2ehvkrzYCXypx'],
  ['ELMAHROSA.OM','FEwPY6LaMvZ0sWt5rjV5u3Mgtk8t8dt12YFtxGN8A519d'],
  ['ELMAHROSA.AE','HajK64CszM7QtvFvQb6qBTFB3NuUxA0P9ZkFBQ7bjX9j'],
];

for (const [name, mint] of list) {
  console.log('transferring', name, mint);
  try {
    await transferV1(umi, { asset: publicKey(mint), newOwner: publicKey(NEW_OWNER) }).sendAndConfirm(umi);
    console.log('done', name);
  } catch(e) {
    console.log('FAILED', name, e.message?.slice(0,300));
  }
}
console.log('ALL DONE');