import fs from "fs";
import { Connection, PublicKey } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { updateV1, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata";
const oldKp = JSON.parse(fs.readFileSync("OLD.json", "utf8"));
const newKp = JSON.parse(fs.readFileSync("NEW.json", "utf8"));
const conn = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const umi = createUmi("https://api.mainnet-beta.solana.com");
const oldKeypair = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(oldKp));
const newPubkey = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(newKp)).publicKey;
umi.use(keypairIdentity(oldKeypair));
console.log("FROM:", oldKeypair.publicKey);
console.log("TO:", newPubkey);
const META = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const accs = await conn.getProgramAccounts(META, { filters: [{ memcmp: { offset: 1, bytes: oldKeypair.publicKey } }] });
console.log("Found metadata accounts:", accs.length);
for (const a of accs) {
  const mintBytes = a.account.data.subarray(33, 65);
  const mintStr = new PublicKey(mintBytes).toBase58();
  const mint = publicKey(mintStr);
  try {
    const asset = await fetchDigitalAsset(umi, mint);
    console.log("\n---", mintStr, "|", asset.metadata.name, "| current:", asset.metadata.updateAuthority);
    if (asset.metadata.updateAuthority === newPubkey) { console.log("Already NEW, skip"); continue; }
    const tx = await updateV1(umi, { mint, authority: oldKeypair, newUpdateAuthority: newPubkey }).sendAndConfirm(umi);
    console.log("ROTATED OK sig:", Buffer.from(tx.signature).toString("base58"));
  } catch(e) { console.log("FAILED", mintStr, e.message?.slice(0,300)); }
}
console.log("\nDONE");
