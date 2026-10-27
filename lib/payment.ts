import { env } from "./env";
// Verifies a SOL payment on-chain through Helius RPC.
const MAX_AGE_SECONDS = 600;

export type PaymentResult = { ok: true } | { ok: false; reason: string };

function rpcUrl() {
  if (env("HELIUS_RPC_URL")) return env("HELIUS_RPC_URL")!; // override (tests)
  return `https://mainnet.helius-rpc.com/?api-key=${env("HELIUS_API_KEY")}`;
}

export async function verifyPayment(opts: {
  txSignature: string;
  payer: string;
  treasury: string;
  minLamports: number;
}): Promise<PaymentResult> {
  let res: Response;
  try {
    res = await fetch(rpcUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [opts.txSignature, { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 }],
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, reason: "rpc_unavailable" };
  }
  if (!res.ok) return { ok: false, reason: "rpc_unavailable" };
  const json: any = await res.json().catch(() => null);
  const tx = json?.result;
  if (!tx) return { ok: false, reason: "tx_not_found" };
  if (tx.meta?.err) return { ok: false, reason: "tx_failed" };
  if (!tx.blockTime || Date.now() / 1000 - tx.blockTime > MAX_AGE_SECONDS) return { ok: false, reason: "tx_too_old" };

  const instructions: any[] = [
    ...(tx.transaction?.message?.instructions ?? []),
    ...((tx.meta?.innerInstructions ?? []).flatMap((i: any) => i.instructions ?? [])),
  ];
  let paid = 0;
  for (const ix of instructions) {
    if (ix.program !== "system" || ix.parsed?.type !== "transfer") continue;
    const info = ix.parsed.info;
    if (info?.source === opts.payer && info?.destination === opts.treasury) paid += Number(info.lamports) || 0;
  }
  if (paid < opts.minLamports) return { ok: false, reason: "insufficient_or_wrong_transfer" };
  return { ok: true };
}
