import fs from 'fs';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore } from '@metaplex-foundation/mpl-core';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import { transferV1 } from '@metaplex-foundation/mpl-core';

const rpc = 'https://api.mainnet-beta.solana.com';
const NEW_OWNER = 'FeuSA7hK2THkJ3ndvwkFjYgx9BYbYczD49zafKV3GQcP';

const umi = createUmi(rpc).use(mplCore());
const secret = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));
const kp = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
umi.use(keypairIdentity(kp));
console.log('from:', kp.publicKey.toString());

// جيب الـ 7 من DAS على طول
let res = await fetch(rpc, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({jsonrpc:'2.0', id:1, method:'getAssetsByOwner', params:{ownerAddress: kp.publicKey.toString(), page:1, limit:1000}})});
let j = await res.json();
console.log('still in old wallet:', j.result?.items?.length);
for (const it of j.result?.items || []) {
  const name = it.content?.metadata?.name;
  console.log('trying', name, it.id);
  try {
    await transferV1(umi, { asset: publicKey(it.id), newOwner: publicKey(NEW_OWNER) }).sendAndConfirm(umi);
    console.log('DONE', name);
  } catch(e) {
    console.log('FAILED', name);
    console.log('FULL ERROR:', JSON.stringify(e, null, 2).slice(0, 2000));
    console.log('MESSAGE:', e.message?.slice(0, 1000));
  }
}
console.log('ALL DONE');