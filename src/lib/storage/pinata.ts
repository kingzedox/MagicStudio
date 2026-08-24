import type { UploadResult, NFTMetadata } from '@/types/nft';

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

/**
 * Upload an image file to Pinata IPFS.
 * Free tier: 500 uploads, 1GB storage.
 */
export async function uploadImageToPinata(
  apiKey: string,
  imageBlob: Blob,
  fileName: string,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', imageBlob, fileName);
  formData.append('pinataMetadata', JSON.stringify({
    name: fileName,
    keyvalues: { app: 'magicstudio' },
  }));

  const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata upload failed: ${error}`);
  }

  const data = await response.json();
  return {
    uri: `${PINATA_GATEWAY}/${data.IpfsHash}`,
    cid: data.IpfsHash,
    provider: 'pinata',
  };
}

/**
 * Upload NFT metadata JSON to Pinata IPFS.
 */
export async function uploadMetadataToPinata(
  apiKey: string,
  metadata: NFTMetadata,
): Promise<UploadResult> {
  const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `${metadata.name}-metadata.json`,
        keyvalues: { app: 'magicstudio', type: 'metadata' },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata metadata upload failed: ${error}`);
  }

  const data = await response.json();
  return {
    uri: `${PINATA_GATEWAY}/${data.IpfsHash}`,
    cid: data.IpfsHash,
    provider: 'pinata',
  };
}
