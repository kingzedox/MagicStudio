import type { NFTMetadata, NFTAttribute } from '@/types/nft';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generate NFT metadata using GROQ's free-tier LLM.
 * Analyzes the design context and generates Metaplex-compliant metadata.
 */
export async function generateNFTMetadata(
  apiKey: string,
  context: {
    elementTypes: string[];
    colors: string[];
    hasText: boolean;
    textContent?: string;
    prompt?: string; // If AI-generated art, the original prompt
  },
  creatorAddress: string,
): Promise<Partial<NFTMetadata>> {
  const systemPrompt = `You are an NFT metadata expert. Generate Metaplex-compliant NFT metadata based on the design context provided. Return ONLY valid JSON with these fields:
- name: Creative, catchy name (max 32 chars)
- description: Compelling description (max 200 chars)
- symbol: Short symbol (max 10 chars)
- attributes: Array of {trait_type, value} objects describing the art (3-6 attributes)
- seller_fee_basis_points: Suggested royalty (recommend 500 = 5%)

Do NOT include image URI or creator addresses. Return ONLY the JSON object, no markdown.`;

  const userPrompt = `Design context:
- Element types used: ${context.elementTypes.join(', ')}
- Colors: ${context.colors.join(', ')}
- Contains text: ${context.hasText ? `Yes - "${context.textContent}"` : 'No'}
${context.prompt ? `- AI generation prompt: "${context.prompt}"` : ''}

Generate NFT metadata for this artwork.`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`GROQ API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from GROQ');
  }

  try {
    const metadata = JSON.parse(content);
    return {
      name: metadata.name || 'Untitled',
      description: metadata.description || '',
      symbol: metadata.symbol || 'MAGIC',
      attributes: (metadata.attributes || []) as NFTAttribute[],
      seller_fee_basis_points: metadata.seller_fee_basis_points || 500,
      properties: {
        files: [],
        creators: [{ address: creatorAddress, share: 100 }],
      },
    };
  } catch {
    // If JSON parsing fails, return defaults
    return {
      name: 'MagicStudio Creation',
      description: 'Created with MagicStudio on Solana',
      symbol: 'MAGIC',
      attributes: [],
      seller_fee_basis_points: 500,
      properties: {
        files: [],
        creators: [{ address: creatorAddress, share: 100 }],
      },
    };
  }
}
