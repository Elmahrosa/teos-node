// Content identifiers computed locally, with no pinning service and no account.
// A CIDv1 (raw codec, sha2-256 multihash) is the same address IPFS would give these exact bytes,
// so a TEOS snapshot can be pinned later without changing anything on our side.
import { sha256Hex } from "./sha256";

const B32 = "abcdefghijklmnopqrstuvwxyz234567";

function base32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length >> 1);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

const CID_V1 = 0x01;
const RAW = 0x55;
const SHA2_256 = 0x12;
const DIGEST_LEN = 0x20;

// CIDv1 raw = 0x01 0x55 | 0x12 0x20 <32-byte sha256>, multibase base32-lower ("b" prefix).
export function cidV1Raw(text: string): string {
  const digest = hexToBytes(sha256Hex(text));
  const bytes = new Uint8Array(4 + digest.length);
  bytes.set([CID_V1, RAW, SHA2_256, DIGEST_LEN]);
  bytes.set(digest, 4);
  return "b" + base32(bytes);
}

// Accepts only the shape this module produces, so a client cannot smuggle an arbitrary string
// into a signed publish message.
export function isCidV1Raw(v: unknown): v is string {
  return typeof v === "string" && /^b[a-z2-7]{58}$/.test(v);
}

export const utf8Bytes = (s: string): number => new TextEncoder().encode(s).length;
