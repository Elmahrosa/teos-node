import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cairo } from "next/font/google";
import Providers from "./providers";
import pricing from "../core/pricing.json";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-cairo", display: "swap" });

const SITE = "https://web4.elmahrosa.org";
const TITLE = "TEOS Sovereign Root - From Alexandria, Egypt. Founded by Ayman Seif.";
const DESC = "A sovereign digital identity on Solana. Make a profile, make a website for your company, do everything. It is yours, your keys. 1 char $2,000, 5+ chars $30. Live SOL price, no renewal.";

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
  name: "TEOS sovereign digital identity",
  description: DESC,
  brand: { "@type": "Brand", name: "TEOS" },
  url: SITE,
  offers: { "@type": "AggregateOffer", lowPrice: String(Math.min(...Object.values(pricing.tiers).flat())), highPrice: String(Math.max(...Object.values(pricing.tiers).flat())), priceCurrency: "USD", availability: "https://schema.org/InStock", url: SITE },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Per-request CSP nonce from middleware.ts: lets our own inline script run while injected scripts stay blocked.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" dir="ltr" className={cairo.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet" />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: 'try{var l=localStorage.getItem("selectedLang")||localStorage.getItem("lang");if(!l){var n=(navigator.language||"").toLowerCase();l=n.indexOf("ar")==0?"ar":n.indexOf("id")==0?"id":"en"}if(l==="ar"||l==="id"){document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";document.documentElement.setAttribute("data-pending","1")}}catch(e){}' }} />
        <style nonce={nonce} dangerouslySetInnerHTML={{ __html: 'html[lang="ar"] body{font-family:var(--font-cairo),sans-serif !important}@keyframes pt-blink{0%,100%{opacity:1}50%{opacity:.2}}@keyframes pt-flash{0%{background:rgba(74,222,128,.55);color:#052e16}100%{background:transparent}}.pt-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-inline-end:6px;box-shadow:0 0 6px #22c55e;animation:pt-blink 1.4s ease-in-out infinite}.pt-flash{border-radius:3px;padding:0 3px;animation:pt-flash 1.2s ease-out}.pt-live{text-align:end}@media(max-width:768px){.pt-live{text-align:start}}.pt-sol::before{content:" · "}@media(max-width:768px){.pt-sol::before{content:none}}main{transition:opacity .15s ease}main[data-fading="1"],html[data-pending] main{opacity:0}@media(max-width:768px){.site-nav{position:static !important}.nav-dup{display:none !important}.hero-connect{display:none !important}.pt-row{display:block !important;padding:10px 0 !important}.pt-len,.pt-usd{display:inline;font-size:16px}.pt-len::after{content:" - "}.pt-amt{display:inline !important;text-align:start !important}.pt-sub{display:block !important;margin-top:2px}.pt-pay,.pt-sol{display:block;font-size:12px}.site-nav>div{padding:8px 12px !important;gap:8px !important}}' }} />
        <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ margin: 0, background: "radial-gradient(ellipse at top,#1a1611,#0a0806 70%)", color: "#f5e6c4", fontFamily: "Georgia, serif", minHeight: "100vh" }}><Providers>{children}</Providers></body>
    </html>
  );
}
