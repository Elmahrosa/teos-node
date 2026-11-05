import fs from "fs";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { fetchDigitalAsset, updateV1 } from "@metaplex-foundation/mpl-token-metadata";

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
    const asset = await fetchDigitalAsset(umi, publicKey(m));
    console.log("\n---", m);
    console.log("Name:", asset.metadata.name, "| Current:", asset.metadata.updateAuthority);
    if (String(asset.metadata.updateAuthority) === String(newPubkey)) { console.log("Already NEW, skip"); continue; }
    const tx = await updateV1(umi, {
      mint: publicKey(m),
      authority: oldKeypair,
      newUpdateAuthority: newPubkey,
    }).sendAndConfirm(umi);
    console.log("ROTATED OK sig:", Buffer.from(tx.signature).toString("base58"));
  } catch(e) { console.log("FAILED", m, e.message?.slice(0,500)); }
}
console.log("\nDONE");
