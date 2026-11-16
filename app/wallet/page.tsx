import type { Metadata } from "next";
import TeosNav from "../../components/TeosNav";
import WalletClient from "./WalletClient";

export const metadata: Metadata = {
  title: "Wallet — TEOS",
  description: "Your .teos names, your SOL balance, and a transfer signed in your own Solana wallet.",
};

export default function WalletPage() {
  return (
    <>
      <TeosNav />
      <WalletClient />
    </>
  );
}
