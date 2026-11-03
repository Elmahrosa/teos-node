import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import Providers from "./providers";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-cairo", display: "swap" });

const SITE = "https://web4.elmahrosa.org";
const TITLE = "TEOS Sovereign Root - From Alexandria, Egypt. Founded by Ayman Seif.";
const DESC = "TEOS Sovereign Root - 125 Sovereign Namespaces. One Root Key. WEB4 Identity Infrastructure. .teos is the master root credential. Founded by Ayman Seif from Alexandria, Egypt. Genesis Access $10.";

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
    <html lang="en" dir="ltr" className={cairo.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: 'try{var l=localStorage.getItem("selectedLang")||localStorage.getItem("lang");if(!l){var n=(navigator.language||"").toLowerCase();l=n.indexOf("ar")==0?"ar":n.indexOf("id")==0?"id":"en"}if(l==="ar"||l==="id"){document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";document.documentElement.setAttribute("data-pending","1");setTimeout(function(){document.documentElement.removeAttribute("data-pending")},2500)}}catch(e){}' }} />
        <style dangerouslySetInnerHTML={{ __html: 'html[lang="ar"] body{font-family:var(--font-cairo),sans-serif !important}html[data-pending] main{visibility:hidden}' }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ margin: 0, background: "radial-gradient(ellipse at top,#1a1611,#0a0806 70%)", color: "#f5e6c4", fontFamily: "Georgia, serif", minHeight: "100vh" }}><Providers>{children}</Providers></body>
    </html>
  );
}
