import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { Header } from "@/components/shared/Header";
import { ClientLayout } from "@/components/error/ClientLayout";
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
  title: "SoundRight — Own a Piece of Music",
  description:
    "Tokenize music royalties on Casper Network. AI-powered verification. x402 micropayments. Fully on-chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-sr-black text-sr-text font-[family-name:var(--font-spotify)]">
        <div id="root">
          <ClientLayout>
            <WalletProvider>
              <Header />
              <main className="flex-1">{children}</main>
            </WalletProvider>
          </ClientLayout>
        </div>
      </body>
    </html>
  );
}
