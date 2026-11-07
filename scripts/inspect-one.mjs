import fs from 'fs';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore } from '@metaplex-foundation/mpl-core';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import { fetchAsset } from '@metaplex-foundation/mpl-core';

const umi = createUmi('https://api.mainnet-beta.solana.com').use(mplCore());
const secret = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));
const kp = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
umi.use(keypairIdentity(kp));

// جرب ELMAHROSA.AE اللي فشل في الصورة
const asset = await fetchAsset(umi, publicKey('HajK64CszM7QtvFvQb6qBTFB3NuUxA0P9ZkFBQ7bjX9j'));
console.log(JSON.stringify(asset, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));