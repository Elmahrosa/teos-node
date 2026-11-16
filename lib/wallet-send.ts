import { SystemProgram, Transaction } from "@solana/web3.js";

// Validates the only transaction shape /api/wallet/send will relay: a signed legacy transfer,
// funded by the same wallet that asked us to send it. This never authorizes anything by itself —
// the user's wallet already signed — it only keeps the endpoint from relaying arbitrary programs.

const SYSTEM_PROGRAM = SystemProgram.programId.toBase58();

export type TransferCheck =
  | { ok: true; lamports: number }
  | { ok: false; error: "bad_transaction" | "wallet_mismatch" | "tx_not_allowed" | "bad_amount" | "unsigned_transaction" | "invalid_signature" };

export function inspectTransfer(encoded: string, wallet: string): TransferCheck {
  let tx: Transaction;
  try {
    // Transaction.from only parses legacy transactions; a v0 transaction with lookup tables throws.
    tx = Transaction.from(Buffer.from(encoded, "base64"));
  } catch {
    return { ok: false, error: "bad_transaction" };
  }

  if (!tx.feePayer || tx.feePayer.toBase58() !== wallet) return { ok: false, error: "wallet_mismatch" };
  if (tx.instructions.length !== 1) return { ok: false, error: "tx_not_allowed" };

  const ix = tx.instructions[0];
  if (ix.programId.toBase58() !== SYSTEM_PROGRAM) return { ok: false, error: "tx_not_allowed" };
  // System transfer = u32 instruction index 2, then u64 lamports.
  if (ix.data.length !== 12 || ix.data.readUInt32LE(0) !== 2) return { ok: false, error: "tx_not_allowed" };
  if (ix.keys[0]?.pubkey.toBase58() !== wallet || !ix.keys[0]?.isSigner) return { ok: false, error: "tx_not_allowed" };

  const lamports = Number(ix.data.readBigUInt64LE(4));
  if (!Number.isSafeInteger(lamports) || lamports <= 0) return { ok: false, error: "bad_amount" };

  // One required signature (the fee payer). verifySignatures throws on a malformed/missing signature.
  if (tx.signatures.length !== 1 || !tx.signatures[0]?.signature) return { ok: false, error: "unsigned_transaction" };
  try {
    if (!tx.verifySignatures()) return { ok: false, error: "invalid_signature" };
  } catch {
    return { ok: false, error: "invalid_signature" };
  }

  return { ok: true, lamports };
}
