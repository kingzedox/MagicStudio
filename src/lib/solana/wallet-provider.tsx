'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

export default function SolanaProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    console.warn("NEXT_PUBLIC_PRIVY_APP_ID is not set in .env.local");
  }

  return (
    <PrivyProvider
      appId={appId || "placeholder-app-id"}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#FF4564', // MagicStudio brand color
          logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', // Temporary placeholder logo
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
        supportedChains: [], // Rely on default Solana configuration
      }}
    >
      {children}
    </PrivyProvider>
  );
}
