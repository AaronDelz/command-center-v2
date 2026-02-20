import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { EmberParticles } from "@/components/ui/EmberParticles";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { FloatingDropButton } from "@/components/notes/FloatingDropButton";
import { FloatingTimer } from "@/components/time/FloatingTimer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Forge",
  description: "The Forge — Orion & Aaron's Workshop",
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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        style={{ background: '#0d0d14', color: '#f0ece6' }}
      >
        <AmbientBackground />
        <EmberParticles count={18} />
        <Sidebar />
        <main
          className="min-h-screen transition-all duration-300 md:ml-[280px] pb-20 md:pb-0 px-4 md:px-8 py-4 md:py-7"
          style={{ position: 'relative', zIndex: 1 }}
        >
          {children}
        </main>
        <FloatingDropButton />
        <FloatingTimer />
        <MobileNav />
      </body>
    </html>
  );
}

export default RootLayout;
