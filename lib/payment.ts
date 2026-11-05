// Verifies a SOL payment on-chain through Helius RPC.
import { env } from "./env";

const MAX_AGE_SECONDS = 600;

export type PaymentResult =
  | { ok: true }
  | { ok: false; reason: string; detail?: Record<string, unknown> };

function rpcUrl() {
  if (env("HELIUS_RPC_URL")) return env("HELIUS_RPC_URL")!;
  return `https://mainnet.helius-rpc.com/?api-key=${env("HELIUS_API_KEY")}`;
}

function validLamports(value: unknown): bigint | null {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value <= 0) return null;
    return BigInt(value);
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    try {
      const parsed = BigInt(value);
      return parsed > BigInt(0) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

export async function verifyPayment(opts: {
  txSignature: string;
  payer: string;
  treasury: string;
  minLamports: number;
}): Promise<PaymentResult> {
  if (
    typeof opts.txSignature !== "string" ||
    !opts.txSignature ||
    typeof opts.payer !== "string" ||
    !opts.payer ||
    typeof opts.treasury !== "string" ||
    !opts.treasury ||
    !Number.isSafeInteger(opts.minLamports) ||
    opts.minLamports <= 0
  ) {
    return { ok: false, reason: "invalid_payment_parameters" };
  }

  let res: Response;
  try {
    res = await fetch(rpcUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
          opts.txSignature,
          {
            encoding: "jsonParsed",
            commitment: "finalized",
            maxSupportedTransactionVersion: 0,
          },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, reason: "rpc_unavailable" };
  }

  if (!res.ok) {
    return {
      ok: false,
      reason: "rpc_unavailable",
      detail: { rpcStatus: res.status },
    };
  }

  const json: any = await res.json().catch(() => null);
  if (!json || json.error) {
    return {
      ok: false,
      reason: "rpc_unavailable",
      detail: { rpcError: json?.error?.message ?? "invalid_rpc_response" },
    };
  }

  const tx = json.result;
  if (!tx) {
    return { ok: false, reason: "tx_not_found" };
  }

  if (!tx.meta || typeof tx.meta !== "object" || !Object.prototype.hasOwnProperty.call(tx.meta, "err")) {
    return { ok: false, reason: "invalid_transaction" };
  }

  if (tx.meta.err !== null) {
    return { ok: false, reason: "tx_failed" };
  }

  const signatures = tx.transaction?.signatures;
  if (
    !Array.isArray(signatures) ||
    !signatures.includes(opts.txSignature)
  ) {
    return { ok: false, reason: "signature_mismatch" };
  }

  const blockTime = tx.blockTime;
  if (!Number.isSafeInteger(blockTime) || blockTime <= 0) {
    return { ok: false, reason: "invalid_block_time" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (blockTime > nowSeconds + 30) {
    return { ok: false, reason: "tx_future" };
  }
  if (nowSeconds - blockTime > MAX_AGE_SECONDS) {
    return { ok: false, reason: "tx_too_old" };
  }

  const outer = tx.transaction?.message?.instructions;
  const inner = tx.meta.innerInstructions;

  if (
    !Array.isArray(outer) ||
    !outer.every((ix: any) => ix !== null && typeof ix === "object") ||
    (inner !== null &&
      (!Array.isArray(inner) ||
        !inner.every((group: any) =>
          group !== null &&
          typeof group === "object" &&
          Number.isSafeInteger(group.index) &&
          group.index >= 0 &&
          Array.isArray(group.instructions) &&
          group.instructions.every((ix: any) => ix !== null && typeof ix === "object")
        )))
  ) {
    return { ok: false, reason: "invalid_transaction" };
  }

  const instructions: any[] = [
    ...outer,
    ...(inner ?? []).flatMap((group: any) => group.instructions),
  ];

  let paid = BigInt(0);
  const seen: { from: string; to: string; lamports: string }[] = [];

  for (const ix of instructions) {
    if (ix?.program !== "system" || ix?.parsed?.type !== "transfer") {
      continue;
    }

    const info = ix.parsed.info;
    const amount = validLamports(info?.lamports);
    if (
      !info ||
      typeof info !== "object" ||
      typeof info.source !== "string" ||
      !info.source ||
      typeof info.destination !== "string" ||
      !info.destination ||
      amount === null
    ) {
      return { ok: false, reason: "invalid_transaction" };
    }

    if (seen.length < 50) {
      seen.push({
        from: info.source,
        to: info.destination,
        lamports: amount.toString(),
      });
    }

    if (
      info.source === opts.payer &&
      info.destination === opts.treasury
    ) {
      paid += amount;
    }
  }

  if (paid > BigInt(Number.MAX_SAFE_INTEGER)) {
    return { ok: false, reason: "payment_amount_overflow" };
  }

  const minimum = BigInt(opts.minLamports);
  if (paid < minimum) {
    return {
      ok: false,
      reason: "insufficient_or_wrong_transfer",
      detail: {
        paid: Number(paid),
        minLamports: opts.minLamports,
        transfers: seen,
      },
    };
  }

  return { ok: true };
}
