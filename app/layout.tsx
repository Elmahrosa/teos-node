import type { Metadata } from "next";
import Providers from "./providers";

const SITE = "https://web4.elmahrosa.org";
const TITLE = "TEOS - Sovereign Web3 Domains - web4.elmahrosa.org";
const DESC = "Register .teos and country domains as Solana assets. $10 genesis.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, url: SITE, siteName: "TEOS", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: ".teos domain name",
  description: DESC,
  brand: { "@type": "Brand", name: "TEOS" },
  url: SITE,
  offers: { "@type": "Offer", price: "10", priceCurrency: "USD", availability: "https://schema.org/InStock", url: SITE },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ margin: 0, background: "radial-gradient(ellipse at top,#1a1611,#0a0806 70%)", color: "#f5e6c4", fontFamily: "Georgia, serif", minHeight: "100vh" }}><Providers>{children}</Providers></body>
    </html>
  );
}
