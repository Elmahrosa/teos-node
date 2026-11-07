"use client";
import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// Individual adapter packages instead of the @solana/wallet-adapter-wallets bundle:
// that bundle pulled in Trezor/Ledger/WalletConnect trees carrying a critical protobufjs RCE advisory.
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { TrustWalletAdapter } from "@solana/wallet-adapter-trust";
import { Coin98WalletAdapter } from "@solana/wallet-adapter-coin98";
import { CoinbaseWalletAdapter } from "@solana/wallet-adapter-coinbase";
import { NightlyWalletAdapter } from "@solana/wallet-adapter-nightly";
import { TokenPocketWalletAdapter } from "@solana/wallet-adapter-tokenpocket";
import { BitgetWalletAdapter } from "@solana/wallet-adapter-bitkeep";
import ConnectProvider from "@/components/ConnectProvider";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { launchWallet, needsDeepLink, type WalletId } from "@/lib/mobileWallet";
import "@solana/wallet-adapter-react-ui/styles.css";

// On mobile Chrome (no wallet injected) these wallets report Loadable and connect() opens the wallet app by deep link,
// so tapping them in the normal modal works. Everywhere else they behave exactly as before.
function deepLinked<T extends new (...a: any[]) => any>(Base: T, id: WalletId): T {
  return class extends Base {
    get readyState() { return needsDeepLink() ? WalletReadyState.Loadable : super.readyState; }
    async connect() { if (needsDeepLink()) { launchWallet(id); return; } return super.connect(); }
  } as T;
}
const MPhantom = deepLinked(PhantomWalletAdapter, "phantom");
const MSolflare = deepLinked(SolflareWalletAdapter, "solflare");
const MTrust = deepLinked(TrustWalletAdapter, "trust");

// Mainnet. Set NEXT_PUBLIC_SOLANA_RPC to a private endpoint if the public one rate-limits.
// In the browser every RPC call goes through our own /api/rpc proxy (Helius, key stays server-side).
const FALLBACK_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Backpack, Glow, Brave and any other Wallet Standard wallet are detected automatically.
  // Ledger is left out on purpose: it cannot sign the message the server asks for.
  // Solana Mobile Wallet Adapter is added by WalletProvider itself on Android Chrome (wallet-adapter-react 0.15).
  const endpoint = typeof window !== "undefined" ? `${window.location.origin}/api/rpc` : FALLBACK_ENDPOINT;
  const wallets = useMemo(() => [
    new MPhantom(), new MSolflare(), new MTrust(), new Coin98WalletAdapter(),
    new CoinbaseWalletAdapter(), new NightlyWalletAdapter(), new TokenPocketWalletAdapter(), new BitgetWalletAdapter(),
  ], []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider><ConnectProvider>{children}</ConnectProvider></WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
