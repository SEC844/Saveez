import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Required for the Docker multi-stage build (standalone output)
  output: "standalone",
  // Fix Turbopack workspace root detection
  turbopack: {
    root: __dirname,
  },
  // Harden HTTP headers
  async headers() {
    const isHttps = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HSTS (Strict-Transport-Security) must only be sent over HTTPS.
          // Sending it over HTTP forces the browser to upgrade future requests
          // to HTTPS, which breaks HTTP-only deployments (e.g. local Unraid).
          ...(isHttps
            ? [
              {
                key: "Strict-Transport-Security",
                value: "max-age=63072000; includeSubDomains; preload",
              },
            ]
            : []),
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
