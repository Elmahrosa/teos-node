"use client";
import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter, SolflareWalletAdapter, TrustWalletAdapter, Coin98WalletAdapter,
  CoinbaseWalletAdapter, NightlyWalletAdapter, TokenPocketWalletAdapter, BitgetWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

// Mainnet. Set NEXT_PUBLIC_SOLANA_RPC to a private endpoint if the public one rate-limits.
const ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Backpack, Glow, Brave and any other Wallet Standard wallet are detected automatically.
  // Ledger is left out on purpose: it cannot sign the message the server asks for.
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(), new SolflareWalletAdapter(), new TrustWalletAdapter(), new Coin98WalletAdapter(),
    new CoinbaseWalletAdapter(), new NightlyWalletAdapter(), new TokenPocketWalletAdapter(), new BitgetWalletAdapter(),
  ], []);
  return (
    <ConnectionProvider endpoint={ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
