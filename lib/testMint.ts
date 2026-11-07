// Owner test mint: 1.teos can be minted by one whitelisted wallet only, at a fixed test price.
// Every other name keeps the public price from core/pricing.json. Override the wallet with TEST_MINT_WALLET.
import { env } from "./env";

export const TEST_MINT_NAME = "1";
export const TEST_MINT_LAMPORTS = 1_000_000; // 0.001 SOL
const DEFAULT_WALLET = "FeuSA7hK2THkJ3ndvwkFjYgx9BYbYczD49zafKV3GQcP";

export const testMintWallet = () => env("TEST_MINT_WALLET") || DEFAULT_WALLET;

// True for 1.teos, the only name under whitelist rules.
export function isTestMintName(domain: string, tlds: string[]): boolean {
  return domain === TEST_MINT_NAME && tlds.includes("teos");
}

export const isTestMintWallet = (wallet: unknown): boolean =>
  typeof wallet === "string" && wallet === testMintWallet();
