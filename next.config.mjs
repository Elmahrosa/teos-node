/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const scriptSrc = `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`;

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
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; " + scriptSrc + "; connect-src 'self' https: https://api.mainnet-beta.solana.com https://*.helius-rpc.com https://*.helius.xyz wss:; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
