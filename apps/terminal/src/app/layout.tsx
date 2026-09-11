import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { ShellProvider } from "@/components/shell-context";

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
    <html lang="en">
      <body className="antialiased bg-[var(--bg-primary)] text-zinc-100">
        <ShellProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-screen-2xl mx-auto w-full">
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
