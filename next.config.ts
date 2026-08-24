import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 uses Turbopack by default
  // Solana libraries work without custom polyfills in Turbopack
  turbopack: {},
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  // Allow images from IPFS gateways
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'gateway.pinata.cloud' },
      { protocol: 'https', hostname: 'arweave.net' },
      { protocol: 'https', hostname: '*.ipfs.dweb.link' },
    ],
  },
};

export default nextConfig;
