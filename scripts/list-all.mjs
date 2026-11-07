import fs from 'fs';

const rpc = 'https://api.mainnet-beta.solana.com';
const secret = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));
import { Keypair } from '@solana/web3.js';
const kp = Keypair.fromSecretKey(new Uint8Array(secret));
const owner = kp.publicKey.toBase58();
console.log('owner:', owner);

// 1. DAS - getAssetsByOwner
let res = await fetch(rpc, {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({jsonrpc:'2.0', id:1, method:'getAssetsByOwner', params:{ownerAddress: owner, page:1, limit:1000, displayOptions:{showFungible:false}}})
});
let j = await res.json();
console.log('DAS total:', j.result?.total, 'items:', j.result?.items?.length);
for (const it of j.result?.items || []) {
  console.log('DAS:', it.content?.metadata?.name, '|', it.id, '| interface:', it.interface);
}

// 2. SPL Token Accounts
res = await fetch(rpc, {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({jsonrpc:'2.0', id:1, method:'getTokenAccountsByOwner', params:[owner, {programId:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'}, {encoding:'jsonParsed'}]})
});
j = await res.json();
console.log('SPL accounts:', j.result?.value?.length);
for (const a of j.result?.value || []) {
  const info = a.account.data.parsed.info;
  console.log('SPL:', info.mint, 'amount:', info.tokenAmount.amount);
}