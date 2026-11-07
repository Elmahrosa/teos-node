import fs from 'fs';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum, getAssetWithProof, transfer } from '@metaplex-foundation/mpl-bubblegum';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';

const rpc = 'https://api.mainnet-beta.solana.com';
const NEW_OWNER = process.env.NEW_OWNER;
if (!NEW_OWNER) { console.error('Set NEW_OWNER=<destination wallet address> first (never reuse an address whose key was ever committed).'); process.exit(1); }

const umi = createUmi(rpc).use(mplBubblegum()).use(mplTokenMetadata());
const secret = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));
const kp = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
umi.use(keypairIdentity(kp));
console.log('from:', kp.publicKey.toString());

let res = await fetch(rpc, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({jsonrpc:'2.0', id:1, method:'getAssetsByOwner', params:{ownerAddress: kp.publicKey.toString(), page:1, limit:1000}})});
let j = await res.json();
console.log('still in old wallet:', j.result?.items?.length);

for (const it of j.result?.items || []) {
  const name = it.content?.metadata?.name;
  console.log('==== trying', name, '====');
  console.log('id:', it.id);
  try {
    const assetWithProof = await getAssetWithProof(umi, publicKey(it.id));
    console.log('tree:', assetWithProof.merkleTree.toString(), 'leaf:', assetWithProof.leafIndex);
    await transfer(umi, {
      ...assetWithProof,
      leafOwner: kp.publicKey,
      newLeafOwner: publicKey(NEW_OWNER),
    }).sendAndConfirm(umi);
    console.log('DONE', name);
  } catch(e) {
    console.log('FAILED', name);
    console.log('MESSAGE:', e.message?.slice(0,1000));
  }
}
console.log('ALL DONE');