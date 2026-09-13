import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { ShellProvider } from "@/components/shell-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PROPR • Personal Trading & Risk Terminal",
  description: "Personal Propr trading terminal, real-time account risk monitor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased bg-[var(--bg-primary)] text-zinc-100 font-sans">
        <ShellProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-4 md:p-7 2xl:p-8">
                <div className="w-full max-w-[1920px] mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </ShellProvider>
      </body>
    </html>
  );
}
