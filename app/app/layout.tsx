// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-base text-text-main`}
      >
        <header className="w-full">
          <div className="container-lg flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-lg sm:text-xl font-semibold text-brand-mint tracking-tight">
                LoopGuard
              </Link>
              <div className="text-sm text-text-muted">HypurrFi yield vaults</div>
            </div>
            <div>
              <span className="inline-flex items-center rounded-full border border-[#C6EFFF33] bg-surface-alt px-3 py-1 text-xs font-medium text-brand-sky">
                HyperEVM
              </span>
            </div>
          </div>
          <div className="divider-thin" />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
