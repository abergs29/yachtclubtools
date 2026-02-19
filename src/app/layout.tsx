import type { Metadata } from "next";
import "./globals.css";

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
      <body className="bg-zinc-50 antialiased">
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
                Admin Tools
              </a>
              <a href="/admin/trades" className="hover:text-zinc-900">
                Trades
              </a>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
