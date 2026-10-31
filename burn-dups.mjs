import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { mplBubblegum, burn, getAssetWithProof } from "@metaplex-foundation/mpl-bubblegum";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import fs from "fs";

const KEY = process.env.HELIUS_KEY;
const OWNER = "3jDzy3rR9VpxXhCnnRpZ2wXQxpprQDNGT2XpL6knGLzG";
const DRY = process.env.DRY !== "0";

const umi = createUmi(`https://mainnet.helius-rpc.com/?api-key=${KEY}`)
  .use(mplBubblegum()).use(dasApi());

const secret = JSON.parse(fs.readFileSync(process.env.KEYPAIR_PATH, "utf8"));
const kp = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(secret));
if (kp.publicKey.toString() !== OWNER) throw new Error("Keypair does not match the mint wallet. Aborting.");
umi.use(keypairIdentity(kp));

const res = await umi.rpc.getAssetsByOwner({ owner: publicKey(OWNER), limit: 1000 });
const by = {};
for (const a of res.items) {
  if (!a.compression?.compressed) continue;
  (by[a.content?.metadata?.name || "?"] ??= []).push(a.id);
}
for (const [name, ids] of Object.entries(by)) {
  if (ids.length < 2) continue;
  for (const id of ids.slice(1)) {
    console.log(DRY ? "WOULD BURN" : "BURNING", name, id);
    if (DRY) continue;
    const proof = await getAssetWithProof(umi, publicKey(id));
    const r = await burn(umi, { ...proof, leafOwner: umi.identity.publicKey }).sendAndConfirm(umi);
    console.log("done", name, Buffer.from(r.signature).toString("base64").slice(0, 16));
    await new Promise(r => setTimeout(r, 1500));
  }
}
