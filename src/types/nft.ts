export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: NFTAttribute[];
  properties: {
    files: { uri: string; type: string }[];
    creators: { address: string; share: number }[];
  };
  seller_fee_basis_points: number;
  symbol?: string;
  collection?: {
    name: string;
    family?: string;
  };
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface MintResult {
  signature: string;
  mint: string;
  metadataUri: string;
  imageUri: string;
  explorer: string;
}

export type StorageProvider = 'pinata' | 'arweave';

export interface UploadResult {
  uri: string;
  cid?: string;
  provider: StorageProvider;
}
