import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

// Break any stuck "Connecting..." loop from a previous session
localStorage.removeItem('walletName');

export const SolanaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use public devnet endpoint
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);

  // Standard hackathon wallets (Wallet Standard auto-detects most modern wallets)
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
