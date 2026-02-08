import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yacht Club Tools",
  description: "Investment club operations, research, and reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-zinc-50 antialiased`}>
        <header className="border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-sm">
            <a href="/" className="font-semibold text-zinc-900">
              Yacht Club Tools
            </a>
            <div className="flex items-center gap-4 text-zinc-600">
              <a href="/dashboard" className="hover:text-zinc-900">
                Monthly Update
              </a>
              <a href="/holdings" className="hover:text-zinc-900">
                Holdings
              </a>
              <a href="/admin/monthly-update" className="hover:text-zinc-900">
                Admin
              </a>
              <a href="/admin/import" className="hover:text-zinc-900">
                Imports
              </a>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
