/** @type {import(\x27next\x27).NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const scriptSrc = `script-src \x27self\x27${isProd ? "" : " \x27unsafe-inline\x27 \x27unsafe-eval\x27"}`;

const nextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { allowedOrigins: ["web4.elmahrosa.org", "ayman.elmahrosa.org", "localhost:3000", "localhost:8080"] } },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src \x27self\x27; img-src \x27self\x27 data: https:; style-src \x27self\x27 \x27unsafe-inline\x27 https://fonts.googleapis.com; font-src \x27self\x27 data: https://fonts.gstatic.com; " + scriptSrc + "; connect-src \x27self\x27 https://api.mainnet-beta.solana.com https://*.helius-rpc.com https://*.helius.xyz wss://*.walletconnect.com wss://*.walletconnect.org; frame-src \x27self\x27 https://*.walletconnect.com; frame-ancestors \x27self\x27",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
