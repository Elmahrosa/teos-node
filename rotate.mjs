import fs from "fs";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { updateV1, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata";
const oldKp = JSON.parse(fs.readFileSync("OLD.json", "utf8"));
const newKp = JSON.parse(fs.readFileSync("NEW.json", "utf8"));
const umi = createUmi("https://api.mainnet-beta.solana.com");
const oldKeypair = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(oldKp));
const newPubkey = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(newKp)).publicKey;
umi.use(keypairIdentity(oldKeypair));
console.log("FROM (old):", oldKeypair.publicKey);
console.log("TO (new):", newPubkey);
let text = "";
for (const f of ["reserved.json", "reserved-list.json"]) {
  if (fs.existsSync(f)) text += fs.readFileSync(f, "utf8") + " ";
}
const mints = [...new Set(text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g) || [])].filter(m => m !== oldKeypair.publicKey && m !== newPubkey);
console.log("Found mints:", mints);
for (const mintStr of mints) {
  const mint = publicKey(mintStr);
  try {
    const asset = await fetchDigitalAsset(umi, mint);
    console.log("\n---", mintStr);
    console.log("Name:", asset.metadata.name, "| Current updateAuthority:", asset.metadata.updateAuthority);
    if (asset.metadata.updateAuthority === newPubkey) { console.log("Already on NEW, skipping"); continue; }
    if (asset.metadata.updateAuthority !== oldKeypair.publicKey) { console.log("SKIP - authority is neither OLD nor NEW"); continue; }
    const tx = await updateV1(umi, { mint, authority: oldKeypair, newUpdateAuthority: newPubkey }).sendAndConfirm(umi);
    console.log("ROTATED OK, sig:", Buffer.from(tx.signature).toString("base58"));
  } catch(e) { console.log("FAILED for", mintStr, e.message?.slice(0,300)); }
}
console.log("\nDONE");
