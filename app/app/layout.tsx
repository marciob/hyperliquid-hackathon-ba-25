// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import WagmiProvider from "./providers/WagmiProvider";
import { ConnectWallet } from "./components/ConnectWallet";
import { Github } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoopGuard",
  description: "HypurrFi yield vaults on HyperEVM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-base text-text-main min-h-dvh flex flex-col overflow-x-hidden`}
      >
        <WagmiProvider>
          <header className="w-full">
            <div className="container-lg flex items-center justify-between py-5">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-[#BAFCE233] bg-[#0C0F13] px-3.5 py-1.5 text-sm font-semibold text-brand-mint shadow-[0_0_12px_rgba(186,252,226,0.20)]"
                >
                  <span>🐾</span>
                  <span>LoopGuard</span>
                </Link>
                <div className="hidden sm:block text-sm text-text-muted">
                  HypurrFi yield vaults
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[#C6EFFF33] bg-surface-alt px-3 py-1 text-xs font-medium text-brand-sky">
                  HyperEVM
                </span>
                <ConnectWallet />
              </div>
            </div>
            <div className="divider-thin" />
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-auto">
            <div className="container-lg py-6">
              <div className="flex justify-end">
                <a
                  href="https://github.com/marciob/hyperliquid-hackathon-ba-25"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-text-main transition-colors"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">GitHub</span>
                </a>
              </div>
            </div>
          </footer>
        </WagmiProvider>
      </body>
    </html>
  );
}
