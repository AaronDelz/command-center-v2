import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Starfield } from "@/components/layout/Starfield";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { QOTD } from "@/components/layout/QOTD";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Command Center V2",
  description: "Orion Dashboard - Local Command Center",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <Starfield />
        <Sidebar />
        <main className="min-h-screen transition-all duration-300 md:ml-[280px] pt-16 md:pt-0 pb-16 md:pb-0">
          <QOTD />
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}

export default RootLayout;
