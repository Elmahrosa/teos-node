import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { create, fetchCollection, mplCore } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import bs58 from "bs58";
import { env } from "./env";

export type MintResult = { asset: string; signature: string };

export function mintConfigured(): boolean {
  return !!env("MINT_AUTHORITY_KEYPAIR");
}

// --- F-03 GUARD: never let key material reach logs / errors ---
function safeErrorMessage(e: any): string {
  const msg = String(e?.message ?? e ?? "unknown").slice(0, 200);
  // Strip anything that looks like a base58 key (32+ chars) or JSON keypair array
  return msg
    .replace(/[1-9A-HJ-NP-Za-km-z]{32,}/g, "[REDACTED]")
    .replace(/\[[\d,\s]{20,}\]/g, "[REDACTED]")
    .replace(/api-key=[^&\s]+/gi, "api-key=[REDACTED]");
}

function secretKeyBytes(): Uint8Array {
  const raw = env("MINT_AUTHORITY_KEYPAIR")!;
  try {
    let bytes: Uint8Array;
    if (raw.trim().startsWith("[")) {
      bytes = Uint8Array.from(JSON.parse(raw));
    } else {
      bytes = bs58.decode(raw.trim());
    }
    if (bytes.length !== 64) throw new Error("invalid_mint_key_length");
    return bytes;
  } catch {
    // NEVER include raw value in error - F-03
    throw new Error("invalid_mint_key");
  }
}

function rpc(): string {
  const explicit = env("MINT_RPC_URL");
  if (explicit) return explicit;
  return `https://mainnet.helius-rpc.com/?api-key=${env("HELIUS_API_KEY")}`;
}

export async function mintTeosAsset(domain: string, owner: string, tld = "teos"): Promise<MintResult | null> {
  if (!mintConfigured()) return null;
  let secret: Uint8Array | null = null;
  try {
    const umi = createUmi(rpc()).use(mplCore());
    secret = secretKeyBytes();
    const kp = umi.eddsa.createKeypairFromSecretKey(secret);
    // Wipe copy immediately after keypair is created - keypair holds its own copy
    secret.fill(0);
    secret = null;
    umi.use(keypairIdentity(kp));

    const collectionAddress = env("COLLECTION_ADDRESS");
    const collection = collectionAddress ? await fetchCollection(umi, publicKey(collectionAddress)) : undefined;
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
  } catch (e: any) {
    // Sanitized log only - never raw error with key / rpc url
    console.error("[mint] mint_failed", safeErrorMessage(e));
    throw new Error("mint_failed");
  } finally {
    if (secret) secret.fill(0);
  }
}

const MINT_COST_LAMPORTS = Number(env("MINT_COST_LAMPORTS")) || 3_200_000;
const BUFFER_LAMPORTS = 1_000_000;
let balCache: { lamports: number; at: number } | null = null;

export async function mintFunds(n: number): Promise<{ ok: boolean; needed: number }> {
  const needed = n * MINT_COST_LAMPORTS + BUFFER_LAMPORTS;
  if (!mintConfigured()) return { ok: false, needed };
  let secret: Uint8Array | null = null;
  try {
    if (!balCache || Date.now() - balCache.at > 20_000) {
      const umi = createUmi(rpc());
      secret = secretKeyBytes();
      const kp = umi.eddsa.createKeypairFromSecretKey(secret);
      secret.fill(0);
      secret = null;
      const bal = await Promise.race([
        umi.rpc.getBalance(kp.publicKey),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("balance_timeout")), 4000)),
      ]);
      balCache = { lamports: Number(bal.basisPoints), at: Date.now() };
    }
    return { ok: balCache.lamports >= needed, needed };
  } catch (e: any) {
    console.error("[mint] balance_check_failed", safeErrorMessage(e));
    return { ok: false, needed };
  } finally {
    if (secret) secret.fill(0);
  }
}