import Providers from "./providers";
export const metadata = {
  title: "TEOS - .teos names on Solana",
  description: "Register your .teos name as a Metaplex Core asset on Solana.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><link rel="preconnect" href="https://fonts.googleapis.com" /><link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet" /></head>
      <body style={{ margin: 0, background: "radial-gradient(ellipse at top,#1a1611,#0a0806 70%)", color: "#f5e6c4", fontFamily: "Georgia, serif", minHeight: "100vh" }}><Providers>{children}</Providers></body>
    </html>
  );
}
