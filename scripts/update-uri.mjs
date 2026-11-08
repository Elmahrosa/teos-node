// Points one Core asset at a new metadata URI. Signer must be the asset's update authority.
//   SIGNER_KEY='<base58 or [..]>' node scripts/update-uri.mjs <ASSET> <NEW_URI> [--dry]
// Example:
//   SIGNER_KEY='...' node scripts/update-uri.mjs <ASSET> https://web4.elmahrosa.org/ashraf.teos.json
import bs58 from "bs58";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { mplCore, fetchAsset, update } from "@metaplex-foundation/mpl-core";
const [asset, uri] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!asset || !uri || !process.env.SIGNER_KEY) { console.error("usage: SIGNER_KEY='...' node scripts/update-uri.mjs <ASSET> <NEW_URI> [--dry]"); process.exit(1); }
const raw = process.env.SIGNER_KEY.trim();
const umi = createUmi(process.env.RPC_URL || "https://api.mainnet-beta.solana.com").use(mplCore());
const kp = umi.eddsa.createKeypairFromSecretKey(raw.startsWith("[") ? Uint8Array.from(JSON.parse(raw)) : bs58.decode(raw));
umi.use(keypairIdentity(kp));
const a = await fetchAsset(umi, publicKey(asset));
console.log(`signer ${kp.publicKey}\nname ${a.name}\nowner ${a.owner}\nupdateAuthority ${a.updateAuthority.address}\nuri (current) ${a.uri}\nuri (new)     ${uri}`);
if (String(a.updateAuthority.address) !== String(kp.publicKey)) { console.error("signer is not the update authority"); process.exit(1); }
if (process.argv.includes("--dry")) { console.log("dry run: nothing sent"); process.exit(0); }
await update(umi, { asset: a, newUri: uri }).sendAndConfirm(umi);
console.log(`after: ${(await fetchAsset(umi, publicKey(asset))).uri}`);
