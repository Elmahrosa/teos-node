import fs from "fs";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { fetchAsset, update, updateAuthority } from "@metaplex-foundation/mpl-core";

const MINTS = [
  "C7DPJZegjbpfd2wJ3GQudWusnzEW6LJpQNWQKtKXBYji",
  "H7TajhCaofXSZ4MAsxmAArCet77yoAeWx878XaZDBDLN",
];
const umi = createUmi("https://api.mainnet-beta.solana.com");
const oldKp = JSON.parse(fs.readFileSync("OLD.json", "utf8"));
const newKp = JSON.parse(fs.readFileSync("NEW.json", "utf8"));
const oldKeypair = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(oldKp));
const newPubkey = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(newKp)).publicKey;
umi.use(keypairIdentity(oldKeypair));
console.log("FROM:", oldKeypair.publicKey);
console.log("TO:", newPubkey);

for (const m of MINTS) {
  try {
    const asset = await fetchAsset(umi, publicKey(m));
    console.log("\n---", m);
    console.log("Name:", asset.name);
    const cur = asset.updateAuthority?.address ? String(asset.updateAuthority.address) : String(asset.updateAuthority);
    console.log("Current:", cur);
    if (cur === String(newPubkey)) { console.log("Already NEW, skip"); continue; }
    const tx = await update(umi, {
      asset: publicKey(m),
      newUpdateAuthority: updateAuthority("Address", [newPubkey]),
    }).sendAndConfirm(umi);
    console.log("ROTATED CORE OK sig:", Buffer.from(tx.signature).toString("base58"));
  } catch(e) { console.log("FAILED", m, e.message?.slice(0,800)); console.log(e.stack?.split("\n").slice(0,4).join("\n")); }
}
console.log("\nDONE");
