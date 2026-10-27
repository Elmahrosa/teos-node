import bs58 from "bs58";
import { verifyAsync } from "@noble/ed25519";

function decode(s: string, len: number): Uint8Array | null {
  try {
    const b = bs58.decode(s);
    if (b.length === len) return b;
  } catch {}
  try {
    const b = Uint8Array.from(Buffer.from(s, "base64"));
    if (b.length === len) return b;
  } catch {}
  return null;
}

// signature: base58 or base64 (64 bytes). publicKey: base58 (32 bytes).
export async function verifyWalletSignature(message: string, signature: string, publicKey: string): Promise<boolean> {
  const sig = decode(signature, 64);
  let pub: Uint8Array | null = null;
  try {
    const b = bs58.decode(publicKey);
    if (b.length === 32) pub = b;
  } catch {}
  if (!sig || !pub) return false;
  try {
    return await verifyAsync(sig, new TextEncoder().encode(message), pub);
  } catch {
    return false;
  }
}
