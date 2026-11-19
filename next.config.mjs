/** @type {import('next').NextConfig} */
// The Content-Security-Policy is set per request in middleware.ts (it needs a fresh nonce each time).
const prod = process.env.NODE_ENV === "production";

const nextConfig = {
  poweredByHeader: false,
  experimental: {
    // Server actions are not used today, but keep the allow-list correct for every host we actually
    // serve from: the Railway domain, the free Vercel host (and its preview URLs), and the Pi proxy.
    serverActions: {
      allowedOrigins: prod
        ? ["web4.elmahrosa.org", "teos-node.vercel.app", "*.vercel.app", "*.pinet.com"]
        : ["web4.elmahrosa.org", "teos-node.vercel.app", "localhost:3000", "localhost:8080"],
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          // allow-popups keeps wallet connect popups working while still isolating the page from other origins.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      // Pi domain verification: plain text, never cached.
      {
        source: "/validation-key.txt",
        headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
    ];
  },
};

export default nextConfig;