// Mints one reserved name as a standalone Core asset, like AYMAN.TEOS and ELMAHROSA.TEOS.
// RUN ON YOUR OWN PC. The key never leaves it.
//
//   MINT_KEY='<base58 string or [1,2,...] array>' node scripts/mint-reserved.mjs <NAME> <OWNER_PUBKEY> [--dry]
//
// Example:
//   MINT_KEY='...' node scripts/mint-reserved.mjs KOSASIH 3jDzy3rR9VpxXhCnnRpZ2wXQxpprQDNGT2XpL6knGLzG --dry
//
// MINT_KEY signs and pays the fee (about 0.003 SOL). OWNER_PUBKEY becomes both owner and update authority.
// Metadata is read from https://web4.elmahrosa.org/<name>.teos.json (must already be deployed).
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey, generateSigner } from "@metaplex-foundation/umi";
import { mplCore, create } from "@metaplex-foundation/mpl-core";
import bs58 from "bs58";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const dry = process.argv.includes("--dry");
const [rawName, owner] = args;
if (!rawName || !owner || !process.env.MINT_KEY) {
  console.error("usage: MINT_KEY='...' node scripts/mint-reserved.mjs <NAME> <OWNER_PUBKEY> [--dry]");
  process.exit(1);
}
const name = rawName.toLowerCase().replace(/\.teos$/, "");
const uri = `https://web4.elmahrosa.org/${name}.teos.json`;
const RPC = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";

const meta = await fetch(uri).then((r) => (r.ok ? r.json() : null)).catch(() => null);
if (!meta) { console.error(`metadata not found at ${uri}`); process.exit(1); }
if (String(meta.name).toUpperCase() !== `${name.toUpperCase()}.TEOS`) { console.error(`metadata name mismatch: ${meta.name}`); process.exit(1); }

const raw = process.env.MINT_KEY.trim();
const secret = raw.startsWith("[") ? Uint8Array.from(JSON.parse(raw)) : bs58.decode(raw);
const umi = createUmi(RPC).use(mplCore());
const kp = umi.eddsa.createKeypairFromSecretKey(secret);
umi.use(keypairIdentity(kp));
const bal = Number((await umi.rpc.getBalance(kp.publicKey)).basisPoints) / 1e9;

console.log(`name      ${name.toUpperCase()}.TEOS\nmetadata  ${uri}\nowner     ${owner}\nsigner    ${kp.publicKey} (${bal} SOL)`);
if (dry) { console.log("dry run: nothing sent"); process.exit(0); }
if (bal < 0.005) { console.error("signer needs at least 0.005 SOL"); process.exit(1); }

const asset = generateSigner(umi);
const res = await create(umi, {
  asset,
  name: `${name.toUpperCase()}.TEOS`,
  uri,
  owner: publicKey(owner),
  updateAuthority: publicKey(owner),
}).sendAndConfirm(umi);
console.log(`minted ${asset.publicKey}\ntx ${bs58.encode(res.signature)}\nhttps://core.metaplex.com/explorer/${asset.publicKey}?env=mainnet`);
