import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker standalone mode — emits .next/standalone/ for minimal container images
  output: "standalone",
  // CSP is intentionally omitted here — it is set per-request in middleware.ts
  // with a unique nonce so that Next.js inline scripts can be allow-listed
  // without 'unsafe-inline'. A static CSP header here would conflict with
  // the nonce-based policy and would be overridden anyway.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
