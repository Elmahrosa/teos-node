// Public wallet addresses only. Never put a private key, seed, or mnemonic here.
// NEXT_PUBLIC_* values are inlined at build time, so they must exist before the build
// (in Railway: add the variable, then redeploy) or they stay empty.

export const WALLETS = {
  // Founder Vault: holds the TEOS domains. Read-only in the dashboard.
  founder: process.env.NEXT_PUBLIC_FOUNDER_WALLET ?? "",
  // Mint wallet: display-only in the dashboard; future mint authority for new mints only.
  mint: process.env.NEXT_PUBLIC_MINT_WALLET ?? "",
  // Receiver / treasury that should collect payments. Display only in the UI.
  receiver: process.env.NEXT_PUBLIC_RECEIVER_WALLET ?? "",
} as const;

// DISPLAY ONLY. This is not the payment authority.
// The server builds quotes and verifies transfers against TREASURY_WALLET
// (app/api/quote, app/api/register, app/api/rpc). Keep this value in sync with
// TREASURY_WALLET in Railway; do not send funds based on it alone.
export function getPaymentDestination(): string {
  return WALLETS.receiver;
}
