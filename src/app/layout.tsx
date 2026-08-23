import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SolanaProvider from "@/lib/solana/wallet-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MagicStudio — Create & Mint NFTs on Solana",
  description: "Design, collaborate, and mint NFTs on Solana. AI-powered creation tools, one-click minting via Metaplex Core, and IPFS storage. No code required.",
  keywords: ["NFT", "Solana", "Metaplex", "design", "mint", "IPFS", "AI art"],
  openGraph: {
    title: "MagicStudio — Create & Mint NFTs on Solana",
    description: "Design, collaborate, and mint NFTs on Solana in under 5 minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SolanaProvider>
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}
