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
console.log("FROM:", oldKeypair.publicKey);
console.log("TO:", newPubkey);
const res = await fetch("https://api.mainnet-beta.solana.com", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getAssetsByAuthority", params: { authorityAddress: oldKeypair.publicKey, page: 1, limit: 1000 } }) });
const j = await res.json();
const items = j.result?.items || [];
console.log("Found by authority:", items.length);
for (const it of items) console.log(" -", it.id, "|", it.content?.metadata?.name);
for (const it of items) {
  const mint = publicKey(it.id);
  try {
    const asset = await fetchDigitalAsset(umi, mint);
    console.log("\n---", it.id, asset.metadata.name, "| current:", asset.metadata.updateAuthority);
    if (asset.metadata.updateAuthority === newPubkey) { console.log("Already NEW, skip"); continue; }
    const tx = await updateV1(umi, { mint, authority: oldKeypair, newUpdateAuthority: newPubkey }).sendAndConfirm(umi);
    console.log("ROTATED OK sig:", Buffer.from(tx.signature).toString("base58"));
  } catch(e) { console.log("FAILED", it.id, e.message?.slice(0,300)); }
}
console.log("\nDONE");
