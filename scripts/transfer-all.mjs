import fs from 'fs';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore } from '@metaplex-foundation/mpl-core';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import { fetchAssetsByOwner, transferV1 } from '@metaplex-foundation/mpl-core';

const NEW_OWNER = 'FeuSA7hK2THkJ3ndvwkFjYgx9BYbYczD49zafKV3GQcP';

const umi = createUmi('https://api.mainnet-beta.solana.com').use(mplCore());
const secret = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));
const kp = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
umi.use(keypairIdentity(kp));

console.log('from:', kp.publicKey.toString());

const assets = await fetchAssetsByOwner(umi, kp.publicKey);
console.log('found:', assets.length);

const wanted = ['AYMAN.BH','AYMAN.KW','AYMAN.QA','ELMAHROSA.AE','ELMAHROSA.OM','ELMAHROSA.SA','FACEBOOK.EG'];

for (const a of assets) {
  if (!wanted.includes(a.name)) continue;
  console.log('transferring', a.name, a.publicKey.toString());
  const tx = await transferV1(umi, {
    asset: a.publicKey,
    newOwner: publicKey(NEW_OWNER),
  }).sendAndConfirm(umi);
  console.log('done', a.name);
}
console.log('ALL DONE');