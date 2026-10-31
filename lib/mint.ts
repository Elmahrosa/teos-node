import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { create, fetchCollection, mplCore } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import bs58 from "bs58";
import { env } from "./env";

export type MintResult = { asset: string; signature: string };

export function mintConfigured(): boolean {
<<<<<<< HEAD
  return !!(env("MINT_AUTHORITY_KEYPAIR") && env("COLLECTION_ADDRESS"));
=======
  return !!env("MINT_AUTHORITY_KEYPAIR");
>>>>>>> d78208a1ed9f64f37dd20993dc2d812e0e4b259f
}

function secretKeyBytes(): Uint8Array {
  const raw = env("MINT_AUTHORITY_KEYPAIR")!;
  if (raw.startsWith("[")) return Uint8Array.from(JSON.parse(raw));
  return bs58.decode(raw);
}

function rpc(): string {
  const explicit = env("MINT_RPC_URL");
  if (explicit) return explicit;
  return `https://mainnet.helius-rpc.com/?api-key=${env("HELIUS_API_KEY")}`;
}

<<<<<<< HEAD
// Mints a Metaplex Core asset into the TEOS collection, owned by the buyer.
=======
// Mints a Metaplex Core asset (into the TEOS collection if COLLECTION_ADDRESS is set), owned by the buyer.
>>>>>>> d78208a1ed9f64f37dd20993dc2d812e0e4b259f
// Returns null when minting is not configured (the registration stays "pending_mint").
export async function mintTeosAsset(domain: string, owner: string, tld = "teos"): Promise<MintResult | null> {
  if (!mintConfigured()) return null;
  const umi = createUmi(rpc()).use(mplCore());
  const kp = umi.eddsa.createKeypairFromSecretKey(secretKeyBytes());
  umi.use(keypairIdentity(kp));

<<<<<<< HEAD
  const collection = await fetchCollection(umi, publicKey(env("COLLECTION_ADDRESS")!));
=======
  // COLLECTION_ADDRESS is optional: without it the asset is a standalone Core asset, like AYMAN.TEOS and ELMAHROSA.TEOS.
  const collectionAddress = env("COLLECTION_ADDRESS");
  const collection = collectionAddress ? await fetchCollection(umi, publicKey(collectionAddress)) : undefined;
>>>>>>> d78208a1ed9f64f37dd20993dc2d812e0e4b259f
  const base = env("PUBLIC_BASE_URL") ?? "https://web4.elmahrosa.org";
  const asset = generateSigner(umi);
  const res = await create(umi, {
    asset,
    collection,
    name: `${domain.toUpperCase()}.${tld.toUpperCase()}`,
    uri: `${base}/api/metadata/${domain}${tld === "teos" ? "" : `?tld=${tld}`}`,
    owner: publicKey(owner),
  }).sendAndConfirm(umi);
  return { asset: asset.publicKey.toString(), signature: base58.deserialize(res.signature)[0] };
}

// --- Balance guard: never take a payment the mint wallet cannot cover. ---
const MINT_COST_LAMPORTS = Number(env("MINT_COST_LAMPORTS")) || 3_200_000; // about 0.0032 SOL per Core asset
const BUFFER_LAMPORTS = 1_000_000;
let balCache: { lamports: number; at: number } | null = null;

// Returns { ok, needed } for n mints. Fails closed: not configured or balance unreadable means not ok.
export async function mintFunds(n: number): Promise<{ ok: boolean; needed: number }> {
  const needed = n * MINT_COST_LAMPORTS + BUFFER_LAMPORTS;
  if (!mintConfigured()) return { ok: false, needed };
  try {
    if (!balCache || Date.now() - balCache.at > 20_000) {
      const umi = createUmi(rpc());
      const kp = umi.eddsa.createKeypairFromSecretKey(secretKeyBytes());
      const bal = await Promise.race([
        umi.rpc.getBalance(kp.publicKey),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("balance_timeout")), 4000)),
      ]);
      balCache = { lamports: Number(bal.basisPoints), at: Date.now() };
    }
    return { ok: balCache.lamports >= needed, needed };
  } catch (e: any) {
    console.error("[mint] balance_check_failed", String(e?.message ?? e).slice(0, 200));
    return { ok: false, needed };
  }
}
