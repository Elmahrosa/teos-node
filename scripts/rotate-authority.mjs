// Moves AYMAN.TEOS and ELMAHROSA.TEOS off a leaked key onto a new one.
// RUN ONLY ON YOUR OWN PC. Key files never leave your machine.
//
//   node scripts/rotate-authority.mjs --dry                      read-only: shows current owner/authority
//   node scripts/rotate-authority.mjs OLD.json NEW.json          rotate (old key signs and pays fees)
//
// For each asset it (1) sets the update authority to the new key, then (2) transfers ownership to the new key.
// Both matter: the owner can transfer or burn the asset, the update authority can change its metadata.
import fs from "fs";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { fetchAsset, update, transfer, updateAuthority } from "@metaplex-foundation/mpl-core";

const RPC = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const MINTS = {
  "AYMAN.TEOS": "C7DPJZegjbpfd2wJ3GQudWusnzEW6LJpQNWQKtKXBYji",
  "ELMAHROSA.TEOS": "H7TajhCaofXSZ4MAsxmAArCet77yoAeWx878XaZDBDLN",
};

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const files = args.filter((a) => !a.startsWith("--"));
const umi = createUmi(RPC);

async function show(label, addr) {
  const a = await fetchAsset(umi, publicKey(addr));
  console.log(`${label}\n  asset            ${addr}\n  owner            ${a.owner}\n  update authority ${a.updateAuthority.address ?? a.updateAuthority.type}`);
  return a;
}

if (dry) {
  for (const [label, addr] of Object.entries(MINTS)) await show(label, addr);
  process.exit(0);
}

if (files.length !== 2) {
  console.error("usage: node scripts/rotate-authority.mjs OLD.json NEW.json   (or --dry)");
  process.exit(1);
}
const read = (f) => umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(f, "utf8"))));
const oldKp = read(files[0]);
const newKp = read(files[1]);
if (oldKp.publicKey === newKp.publicKey) {
  console.error("old and new key are the same. Generate a new key first.");
  process.exit(1);
}
umi.use(keypairIdentity(oldKp));
console.log(`Rotating from ${oldKp.publicKey} to ${newKp.publicKey}`);

for (const [label, addr] of Object.entries(MINTS)) {
  const a = await show(`${label} (before)`, addr);
  if (String(a.owner) !== String(oldKp.publicKey)) {
    console.error(`  skipped: owner is not the old key`);
    continue;
  }
  await update(umi, { asset: a, newUpdateAuthority: updateAuthority("Address", [newKp.publicKey]) }).sendAndConfirm(umi);
  const b = await fetchAsset(umi, publicKey(addr));
  await transfer(umi, { asset: b, newOwner: newKp.publicKey }).sendAndConfirm(umi);
  await show(`${label} (after)`, addr);
}
console.log("Done. Verify both assets on a block explorer, then use the new key from now on.");
