import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';
import { fetchAsset } from '@metaplex-foundation/mpl-core';

const umi = createUmi('https://api.mainnet-beta.solana.com');

const assetId = publicKey('H7TajhCaofXSZ4MAsxmAArCet77yoAeWx878XaZDBDLN');
const asset = await fetchAsset(umi, assetId);

console.log('=== ASSET ON-CHAIN DATA ===');
console.log('Name:', asset.name);
console.log('URI:', asset.uri);
console.log('Owner:', asset.owner);
console.log('Update Authority:', asset.updateAuthority);