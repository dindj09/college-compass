import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "College Compass — Your College Application Guide",
  description: "AI-powered college application guidance for high school students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </main>
        <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
          College Compass &mdash; Powered by Claude AI
        </footer>
      </body>
    </html>
  );
}
