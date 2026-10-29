// Sets the update authority of one founder asset to a PUBLIC address. Owner is untouched.
//   node scripts/set-update-authority.mjs OLD.json <ASSET> <NEW_AUTHORITY_PUBKEY>
import fs from "fs";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { fetchAsset, update, updateAuthority } from "@metaplex-foundation/mpl-core";
const [file, asset, to] = process.argv.slice(2);
const umi = createUmi(process.env.RPC_URL || "https://api.mainnet-beta.solana.com");
const kp = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(file, "utf8"))));
umi.use(keypairIdentity(kp));
const a = await fetchAsset(umi, publicKey(asset));
console.log(`signer ${kp.publicKey}\nbefore: owner ${a.owner} updateAuthority ${a.updateAuthority.address}`);
await update(umi, { asset: a, newUpdateAuthority: updateAuthority("Address", [publicKey(to)]) }).sendAndConfirm(umi);
const b = await fetchAsset(umi, publicKey(asset));
console.log(`after:  owner ${b.owner} updateAuthority ${b.updateAuthority.address}`);
