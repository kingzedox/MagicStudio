'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

export default function SolanaProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    console.warn("NEXT_PUBLIC_PRIVY_APP_ID is not set in .env.local");
  }

  if (!appId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4 text-center">
        <div className="max-w-md bg-gray-800 p-8 rounded-xl border border-red-500/50">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Missing Privy App ID</h2>
          <p className="text-gray-300 mb-4">
            Next.js cannot start the authentication provider because the Privy App ID is missing from your environment variables.
          </p>
          <div className="bg-black/50 p-4 rounded text-left font-mono text-sm mb-4">
            1. Go to dashboard.privy.io<br/>
            2. Copy your App ID<br/>
            3. Add it to .env.local:<br/>
            <span className="text-blue-400">NEXT_PUBLIC_PRIVY_APP_ID=your_id_here</span>
          </div>
          <p className="text-sm text-yellow-400">
            Remember to restart your dev server after saving .env.local!
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#FF4564',
          logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
          walletChainType: 'solana-only',
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
