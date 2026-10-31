export const metadata = {
  title: "TEOS - .teos names on Solana",
  description: "Register your .teos name as a Metaplex Core asset on Solana.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b0d12", color: "#e8eaf0", fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
