const HF_API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';

/**
 * Generate an image from a text prompt using Hugging Face's free inference API.
 * Uses Stable Diffusion XL for high-quality output.
 * Free tier: rate limited (~few images per minute)
 */
export async function generateImage(
  apiKey: string,
  prompt: string,
): Promise<Blob> {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        width: 1024,
        height: 1024,
        num_inference_steps: 30,
        guidance_scale: 7.5,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Model might be loading — HF returns 503 when cold-starting
    if (response.status === 503) {
      throw new Error('AI model is loading. Please try again in 20-30 seconds.');
    }
    throw new Error(`Image generation failed: ${response.status} - ${errorText}`);
  }

  return response.blob();
}

/**
 * Convert a Blob to a data URL for canvas rendering
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
