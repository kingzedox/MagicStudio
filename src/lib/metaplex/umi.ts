import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore } from '@metaplex-foundation/mpl-core';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import type { WalletAdapter } from '@solana/wallet-adapter-base';

export function createUmiClient(rpcEndpoint: string, wallet: WalletAdapter) {
  return createUmi(rpcEndpoint)
    .use(mplCore())
    .use(walletAdapterIdentity(wallet));
}
