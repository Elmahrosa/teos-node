import fs from 'fs';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore } from '@metaplex-foundation/mpl-core';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import { fetchAsset } from '@metaplex-foundation/mpl-core';

const rpc = 'https://api.mainnet-beta.solana.com';
const umi = createUmi(rpc).use(mplCore());
const secret = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));
const kp = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
umi.use(keypairIdentity(kp));

let res = await fetch(rpc, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({jsonrpc:'2.0', id:1, method:'getAssetsByOwner', params:{ownerAddress: kp.publicKey.toString(), page:1, limit:1000}})});
let j = await res.json();

for (const it of j.result?.items || []) {
  const name = it.content?.metadata?.name;
  console.log('====', name, '====');
  console.log('id:', it.id, 'len:', it.id.length);
  try {
    const a = await fetchAsset(umi, publicKey(it.id));
    console.log('owner:', a.owner.toString());
    console.log('updateAuthority:', a.updateAuthority?.type, a.updateAuthority?.address?.toString?.() || a.updateAuthority);
    console.log('collection:', JSON.stringify(a.collection));
    console.log('plugins:', Object.keys(a.plugins || {}));
    console.log('isFrozen:', a.isFrozen);
  } catch(e) {
    console.log('fetchAsset FAILED:', e.message?.slice(0,500));
  }
}