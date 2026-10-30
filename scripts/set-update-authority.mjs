// Sets the update authority of one founder asset to a PUBLIC address. Owner is untouched.
//   node scripts/set-update-authority.mjs OLD.json <ASSET> <NEW_AUTHORITY_PUBKEY>
// or, with the signer's key in the environment (base58 string or [..] array) and "-" as the file:
//   $env:SIGNER_KEY='...'; node scripts/set-update-authority.mjs - <ASSET> <NEW_AUTHORITY_PUBKEY>
// The signer must be the CURRENT update authority and needs about 0.001 SOL for the fee.
import fs from "fs";
import bs58 from "bs58";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { fetchAsset, update, updateAuthority } from "@metaplex-foundation/mpl-core";
const [file, asset, to] = process.argv.slice(2);
const umi = createUmi(process.env.RPC_URL || "https://api.mainnet-beta.solana.com");
const rawKey = file === "-" ? process.env.SIGNER_KEY.trim() : fs.readFileSync(file, "utf8").trim();
const kp = umi.eddsa.createKeypairFromSecretKey(rawKey.startsWith("[") ? Uint8Array.from(JSON.parse(rawKey)) : bs58.decode(rawKey));
umi.use(keypairIdentity(kp));
const a = await fetchAsset(umi, publicKey(asset));
console.log(`signer ${kp.publicKey}\nbefore: owner ${a.owner} updateAuthority ${a.updateAuthority.address}`);
await update(umi, { asset: a, newUpdateAuthority: updateAuthority("Address", [publicKey(to)]) }).sendAndConfirm(umi);
const b = await fetchAsset(umi, publicKey(asset));
console.log(`after:  owner ${b.owner} updateAuthority ${b.updateAuthority.address}`);
