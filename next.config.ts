import type { NextConfig } from "next";

/**
 * Next.js configuration.
 *
 * Security headers applied at the CDN/server layer for all responses.
 * CSP is intentionally restrictive — no inline scripts, no unsafe-eval.
 * Tailwind v4 CSS-in-JS class names are generated at build time, so
 * `unsafe-inline` for style-src is required for CSS-in-JS compatibility.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Clickjacking prevention
          { key: "X-Frame-Options", value: "DENY" },
          // MIME sniffing prevention
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Disable DNS prefetching to prevent info leakage
          { key: "X-DNS-Prefetch-Control", value: "off" },
          // Permissions policy — deny hardware APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // HSTS — 1 year, include subdomains, preload
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Referrer policy — only send origin on same-origin requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Styles: self + unsafe-inline required for Tailwind v4 / Next.js injected styles
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + data URIs for base64 images
              "img-src 'self' data:",
              // Scripts: self only — no eval, no inline
              "script-src 'self'",
              // No plugins
              "object-src 'none'",
              // No framing
              "frame-ancestors 'none'",
              // Base URI locked to self
              "base-uri 'self'",
              // Form submissions only to self
              "form-action 'self'",
              // Upgrade insecure requests in production
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
