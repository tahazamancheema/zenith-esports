import type { Metadata } from "next";
import { Rajdhani, Inter } from 'next/font/google'
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "Zenith Esports | Pakistan's Premier Esports Platform",
  description: "Compete in PUBG Mobile tournaments, join scrims, and rise through the ranks. Pakistan's premier esports tournament platform.",
  keywords: "esports, PUBG Mobile, tournaments, Pakistan, gaming, competitive",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${rajdhani.variable} ${inter.variable} antialiased min-h-screen flex flex-col mesh-bg`}>
        <Navbar />
        <main className="flex-1 pt-16 w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
