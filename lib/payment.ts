import { env } from "./env";

// Only finalized Solana transactions are accepted.
// Payments older than this window are rejected.
const MAX_AGE_SECONDS = 600;
const MAX_FUTURE_SECONDS = 30;
const RPC_TIMEOUT_MS = 10_000;

export type PaymentResult =
  | { ok: true }
  | {
      ok: false;
      reason: string;
      detail?: Record<string, unknown>;
    };

type TransferRecord = {
  from: string;
  to: string;
  lamports: string;
};

function rpcUrl(): string | null {
  const explicit = env("HELIUS_RPC_URL");
  if (explicit) return explicit;

  const apiKey = env("HELIUS_API_KEY");
  if (!apiKey) return null;

  return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
}

function invalid(reason: string): PaymentResult {
  return { ok: false, reason };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validLamports(value: unknown): bigint | null {
  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return null;
  }

  if (
    typeof value === "number" &&
    (!Number.isSafeInteger(value) || value < 0)
  ) {
    return null;
  }

  if (
    typeof value === "string" &&
    !/^(0|[1-9]\d*)$/.test(value)
  ) {
    return null;
  }

  try {
    const amount = BigInt(value);

    if (amount < BigInt("0") || amount > BigInt("18446744073709551615")) {
      return null;
    }

    return amount;
  } catch {
    return null;
  }
}

function extractInstructions(tx: any): any[] | null {
  const messageInstructions =
    tx?.transaction?.message?.instructions;

  const innerInstructions =
    tx?.meta?.innerInstructions;

  if (!Array.isArray(messageInstructions)) {
    return null;
  }

  if (
    innerInstructions !== null &&
    !Array.isArray(innerInstructions)
  ) {
    return null;
  }

  const instructions = [...messageInstructions];

  for (const group of innerInstructions ?? []) {
    if (
      !group ||
      typeof group !== "object" ||
      !Array.isArray(group.instructions)
    ) {
      return null;
    }

    instructions.push(...group.instructions);
  }

  return instructions;
}

export async function verifyPayment(opts: {
  txSignature: string;
  payer: string;
  treasury: string;
  minLamports: number;
}): Promise<PaymentResult> {
  if (
    !opts ||
    !isNonEmptyString(opts.txSignature) ||
    !isNonEmptyString(opts.payer) ||
    !isNonEmptyString(opts.treasury) ||
    opts.payer === opts.treasury ||
    !Number.isSafeInteger(opts.minLamports) ||
    opts.minLamports <= 0
  ) {
    return invalid("invalid_payment_parameters");
  }

  const url = rpcUrl();

  if (!url) {
    return invalid("rpc_unavailable");
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
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
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    });
  } catch {
    return invalid("rpc_unavailable");
  }

  if (!response.ok) {
    return {
      ok: false,
      reason: "rpc_unavailable",
      detail: { rpcStatus: response.status },
    };
  }

  const json: any = await response.json().catch(() => null);

  if (
    !json ||
    typeof json !== "object" ||
    json.error
  ) {
    return {
      ok: false,
      reason: "rpc_unavailable",
      detail: {
        rpcError: json?.error?.message ?? "invalid_rpc_response",
      },
    };
  }

  const tx = json.result;

  if (tx === null || tx === undefined) {
    return invalid("tx_not_found");
  }

  if (
    typeof tx !== "object" ||
    !tx.transaction ||
    !tx.transaction.message ||
    !Array.isArray(tx.transaction.signatures) ||
    !tx.meta ||
    typeof tx.meta !== "object" ||
    !Object.prototype.hasOwnProperty.call(tx.meta, "err") ||
    !Object.prototype.hasOwnProperty.call(tx.meta, "innerInstructions")
  ) {
    return invalid("invalid_transaction");
  }

  if (tx.transaction.signatures[0] !== opts.txSignature) {
    return invalid("signature_mismatch");
  }

  if (tx.meta.err !== null) {
    return invalid("tx_failed");
  }

  // Verify that the payer is actually a transaction signer.
  const accountKeys = tx.transaction.message.accountKeys;

  if (!Array.isArray(accountKeys)) {
    return invalid("invalid_transaction");
  }

  const payerAccount = accountKeys.find(
    (account: any) =>
      account &&
      typeof account === "object" &&
      account.pubkey === opts.payer
  );

  if (!payerAccount || payerAccount.signer !== true) {
    return invalid("payer_not_signer");
  }

  const blockTime = tx.blockTime;

  if (
    typeof blockTime !== "number" ||
    !Number.isSafeInteger(blockTime) ||
    blockTime <= 0
  ) {
    return invalid("invalid_block_time");
  }

  const now = Math.floor(Date.now() / 1000);

  if (blockTime > now + MAX_FUTURE_SECONDS) {
    return invalid("tx_future");
  }

  if (now - blockTime > MAX_AGE_SECONDS) {
    return invalid("tx_too_old");
  }

  const instructions = extractInstructions(tx);

  if (!instructions) {
    return invalid("invalid_transaction");
  }

  let paid = BigInt("0");

  const seen: TransferRecord[] = [];

  for (const ix of instructions) {
    if (!ix || typeof ix !== "object") {
      return invalid("invalid_transaction");
    }

    if (ix.program !== "system") {
      continue;
    }

    if (!ix.parsed || typeof ix.parsed !== "object") {
      return invalid("invalid_transaction");
    }

    if (ix.parsed.type !== "transfer") {
      continue;
    }

    const info = ix.parsed.info;

    if (
      !info ||
      typeof info !== "object" ||
      !isNonEmptyString(info.source) ||
      !isNonEmptyString(info.destination)
    ) {
      return invalid("invalid_transaction");
    }

    const amount = validLamports(info.lamports);

    if (amount === null || amount <= BigInt("0")) {
      return invalid("invalid_transaction");
    }

    seen.push({
      from: info.source,
      to: info.destination,
      lamports: amount.toString(),
    });

    if (
      info.source === opts.payer &&
      info.destination === opts.treasury
    ) {
      paid += amount;
    }
  }

  const minimum = BigInt(opts.minLamports);

  if (paid < minimum) {
    return {
      ok: false,
      reason: "insufficient_or_wrong_transfer",
      detail: {
        paid: paid.toString(),
        minLamports: opts.minLamports,
        transfers: seen,
      },
    };
  }

  return { ok: true };
}
