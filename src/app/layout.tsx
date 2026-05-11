import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ConfigManager — Secure Infrastructure Config",
    template: "%s | ConfigManager",
  },
  description:
    "Enterprise-grade dashboard for all infrastructure configs, secrets, API keys, certificates, and environment variables.",
};

/**
 * Root layout — applies fonts and global CSS.
 * Security headers are applied via next.config.ts (server-layer, not client-layer).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full"><Providers>{children}</Providers></body>
    </html>
  );
}
