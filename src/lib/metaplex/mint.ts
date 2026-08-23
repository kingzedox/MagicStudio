import { generateSigner, percentAmount } from '@metaplex-foundation/umi';
import { create, fetchAsset } from '@metaplex-foundation/mpl-core';
import type { Umi } from '@metaplex-foundation/umi';
import type { MintResult } from '@/types/nft';

/**
 * Mint a single NFT using Metaplex Core.
 * Cost: ~0.0029 SOL per mint (single-account design)
 */
export async function mintSingleNFT(
  umi: Umi,
  name: string,
  metadataUri: string,
): Promise<MintResult> {
  const asset = generateSigner(umi);

  const tx = await create(umi, {
    asset,
    name,
    uri: metadataUri,
  }).sendAndConfirm(umi);

  const signature = Buffer.from(tx.signature).toString('base64');
  const mintAddress = asset.publicKey.toString();

  return {
    signature,
    mint: mintAddress,
    metadataUri,
    imageUri: '', // Populated by caller
    explorer: `https://explorer.solana.com/address/${mintAddress}?cluster=${getCluster(umi)}`,
  };
}

/**
 * Mint an NFT with royalties and creator info.
 */
export async function mintNFTWithRoyalties(
  umi: Umi,
  name: string,
  metadataUri: string,
  royaltyPercent: number,
  creators: { address: string; percentage: number }[],
): Promise<MintResult> {
  const asset = generateSigner(umi);

  const tx = await create(umi, {
    asset,
    name,
    uri: metadataUri,
    plugins: [
      {
        type: 'Royalties',
        basisPoints: royaltyPercent * 100, // Convert % to basis points
        creators: creators.map(c => ({
          address: c.address as unknown as ReturnType<typeof generateSigner>['publicKey'],
          percentage: c.percentage,
        })),
        ruleSet: { type: 'None' },
      },
    ],
  }).sendAndConfirm(umi);

  const signature = Buffer.from(tx.signature).toString('base64');
  const mintAddress = asset.publicKey.toString();

  return {
    signature,
    mint: mintAddress,
    metadataUri,
    imageUri: '',
    explorer: `https://explorer.solana.com/address/${mintAddress}?cluster=${getCluster(umi)}`,
  };
}

/**
 * Fetch a minted asset's on-chain data
 */
export async function fetchMintedAsset(umi: Umi, mintAddress: string) {
  return fetchAsset(umi, mintAddress as unknown as ReturnType<typeof generateSigner>['publicKey']);
}

function getCluster(umi: Umi): string {
  const endpoint = umi.rpc.getEndpoint();
  if (endpoint.includes('mainnet')) return 'mainnet-beta';
  if (endpoint.includes('devnet')) return 'devnet';
  return 'devnet';
}
