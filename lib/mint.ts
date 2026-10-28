import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { create, fetchCollection, mplCore } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import bs58 from "bs58";
import { env } from "./env";

export type MintResult = { asset: string; signature: string };

export function mintConfigured(): boolean {
  return !!(env("MINT_AUTHORITY_KEYPAIR") && env("COLLECTION_ADDRESS"));
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

// Mints a Metaplex Core asset into the TEOS collection, owned by the buyer.
// Returns null when minting is not configured (the registration stays "pending_mint").
export async function mintTeosAsset(domain: string, owner: string): Promise<MintResult | null> {
  if (!mintConfigured()) return null;
  const umi = createUmi(rpc()).use(mplCore());
  const kp = umi.eddsa.createKeypairFromSecretKey(secretKeyBytes());
  umi.use(keypairIdentity(kp));

  const collection = await fetchCollection(umi, publicKey(env("COLLECTION_ADDRESS")!));
  const base = env("PUBLIC_BASE_URL") ?? "https://web4.elmahrosa.org";
  const asset = generateSigner(umi);
  const res = await create(umi, {
    asset,
    collection,
    name: `${domain.toUpperCase()}.TEOS`,
    uri: `${base}/api/metadata/${domain}`,
    owner: publicKey(owner),
  }).sendAndConfirm(umi);
  return { asset: asset.publicKey.toString(), signature: base58.deserialize(res.signature)[0] };
}
