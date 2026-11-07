/** @type {import('next').NextConfig} */
// The Content-Security-Policy is set per request in middleware.ts (it needs a fresh nonce each time).
const prod = process.env.NODE_ENV === "production";

const nextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: { allowedOrigins: prod ? ["web4.elmahrosa.org"] : ["web4.elmahrosa.org", "localhost:3000", "localhost:8080"] },
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
    ];
  },
};

export default nextConfig;