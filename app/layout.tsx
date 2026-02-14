import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wearlog",
  description: "Outfit log app",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <header className="mb-8 flex items-center justify-between">
            <a href="/" className="text-xl font-semibold tracking-tight">
              Wearlog
            </a>
            <nav className="flex items-center gap-3 text-sm text-zinc-300">
              <a className="hover:text-white" href="/new">New</a>
            </nav>
          </header>

          <main>{children}</main>

          <footer className="mt-10 text-xs text-zinc-500">
            private log
          </footer>
        </div>
      </body>
    </html>
  );
}

