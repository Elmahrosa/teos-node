import bs58 from "bs58";
import { env } from "./env";

// Signed, server-verified free claims for the Founder wallet (and the family mint tool).
// The client never decides the owner and never decides the price: both come from server env.
// A claim only succeeds when the signer IS env("FOUNDER_WALLET") and the signature covers
// this exact action + owner + name list + one-time nonce.

export const CLAIM_MESSAGE_PREFIX = "TEOS founder claim v1";

export type ClaimAction = "claim" | "family";

export function founderWallet(): string {
  return (env("FOUNDER_WALLET") ?? "").trim();
}

// Family names are minted to this wallet only. Never accepted from the request body.
export function familyWallet(): string {
  return (env("FAMILY_WALLET") ?? "").trim();
}

export function isPublicKey(value: unknown): value is string {
  if (typeof value !== "string" || value.length < 32 || value.length > 44) return false;
  try {
    return bs58.decode(value).length === 32;
  } catch {
    return false;
  }
}

// Canonical, human-readable message. Every field that changes the outcome is inside the signature.
export function buildClaimMessage(action: ClaimAction, names: string[], owner: string, nonce: string): string {
  return [
    `${CLAIM_MESSAGE_PREFIX}:${action}`,
    `owner:${owner}`,
    `names:${names.join(",")}`,
    `nonce:${nonce}`,
  ].join("\n");
}

// Base names only: lowercase a-z, 0-9, hyphen, 1-30 chars, no dots.
export function parseClaimNames(raw: unknown, max = 20): string[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > max) return null;
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") return null;
    const name = item.trim().toLowerCase().replace(/\.teos$/, "");
    if (!/^[a-z0-9-]{1,30}$/.test(name)) return null;
    if (!out.includes(name)) out.push(name);
  }
  return out.length ? out : null;
}

export function nonceOk(raw: unknown): raw is string {
  return typeof raw === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(raw);
}

// Server-generated, one-time nonce. 36 hex chars, inside the accepted shape.
export function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
