'use client';

import { useState } from 'react';
import { X, Upload, Wand2, Sparkles, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { Connection } from '@solana/web3.js';
import { uploadImageToPinata, uploadMetadataToPinata } from '@/lib/storage/pinata';
import { generateNFTMetadata } from '@/lib/ai/metadata';
import { createUmiClient } from '@/lib/metaplex/umi';
import { mintSingleNFT } from '@/lib/metaplex/mint';

interface MintPanelProps {
  elements: CanvasElement[];
  canvasRef: React.RefObject<CanvasAreaHandle | null>;
  roomId: string;
  onClose: () => void;
  onSuccess: (result: MintResult) => void;
}

type MintStep = 'metadata' | 'uploading' | 'minting' | 'done';

export default function MintPanel({ elements, canvasRef, roomId, onClose, onSuccess }: MintPanelProps) {
  const { wallets } = useWallets();
  const activeWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
  const publicKeyStr = activeWallet?.address;

  const [step, setStep] = useState<MintStep>('metadata');
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);

  // Metadata form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [symbol, setSymbol] = useState('MAGIC');
  const [royaltyPercent, setRoyaltyPercent] = useState(5);
  const [attributes, setAttributes] = useState<NFTAttribute[]>([]);

  const handleAIGenerate = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!apiKey) {
      setError('GROQ API key not configured. Add NEXT_PUBLIC_GROQ_API_KEY to .env.local');
      return;
    }
    if (!publicKeyStr) {
      setError('Connect your wallet first');
      return;
    }

    setIsGeneratingMeta(true);
    setError(null);
    try {
      const context = {
        elementTypes: [...new Set(elements.map(el => el.type))],
        colors: [...new Set(elements.map(el => el.color).filter(Boolean))],
        hasText: elements.some(el => el.type === 'text'),
        textContent: elements.filter(el => el.type === 'text').map(el => el.text).join(', '),
      };

      const generated = await generateNFTMetadata(apiKey, context, publicKeyStr);
      if (generated.name) setName(generated.name);
      if (generated.description) setDescription(generated.description);
      if (generated.symbol) setSymbol(generated.symbol);
      if (generated.attributes) setAttributes(generated.attributes);
      if (generated.seller_fee_basis_points) setRoyaltyPercent(generated.seller_fee_basis_points / 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI generation failed');
    } finally {
      setIsGeneratingMeta(false);
    }
  };

  const handleMint = async () => {
    if (!activeWallet) {
      setError('Connect your wallet to mint');
      return;
    }
    if (!name.trim()) {
      setError('NFT name is required');
      return;
    }

    const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
    if (!pinataJwt) {
      setError('Pinata API key not configured. Add NEXT_PUBLIC_PINATA_JWT to .env.local');
      return;
    }

    setError(null);

    // Step 1: Export canvas as image
    setStep('uploading');
    try {
      const stage = canvasRef.current?.getStage() as { toDataURL: (opts: { pixelRatio: number }) => string } | undefined;
      if (!stage) throw new Error('Canvas not ready');

      const dataURL = stage.toDataURL({ pixelRatio: 2 });
      const res = await fetch(dataURL);
      const blob = await res.blob();

      // Step 2: Upload image to IPFS
      const imageUpload = await uploadImageToPinata(pinataJwt, blob, `${roomId}-nft.png`);

      // Step 3: Build & upload metadata
      const metadata: NFTMetadata = {
        name,
        description,
        symbol,
        image: imageUpload.uri,
        external_url: `https://magicstudio.app/studio/${roomId}`,
        attributes,
        seller_fee_basis_points: royaltyPercent * 100,
        properties: {
          files: [{ uri: imageUpload.uri, type: 'image/png' }],
          creators: [{ address: publicKeyStr, share: 100 }],
        },
      };

      const metadataUpload = await uploadMetadataToPinata(pinataJwt, metadata);

      // Step 4: Mint NFT via Metaplex Core
      setStep('minting');
      
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
      const umi = createUmiClient(rpcUrl, activeWallet as any);
      
      const result = await mintSingleNFT(umi, name, metadataUpload.uri);
      result.imageUri = imageUpload.uri;

      setMintResult(result);
      setStep('done');
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Minting failed');
      setStep('metadata');
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF4564] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Mint NFT</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {step === 'metadata' && 'Configure your NFT metadata'}
                {step === 'uploading' && 'Uploading to IPFS...'}
                {step === 'minting' && 'Minting on Solana...'}
                {step === 'done' && 'NFT minted successfully!'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          {step === 'metadata' && (
            <>
              {/* AI Generate Button */}
              <button
                onClick={handleAIGenerate}
                disabled={isGeneratingMeta}
                className="w-full px-4 py-3 rounded-xl bg-[#FF4564]/10 border border-[#FF4564]/20 text-[#FF4564] text-sm font-medium hover:bg-[#FF4564]/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingMeta ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating with AI...</>
                ) : (
                  <><Wand2 className="w-4 h-4" /> Auto-fill with AI</>
                )}
              </button>

              {/* Name */}
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome NFT"
                  maxLength={32}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4564]/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your NFT..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4564]/50 resize-none"
                />
              </div>

              {/* Symbol + Royalty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4564]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Royalty %</label>
                  <input
                    type="number"
                    value={royaltyPercent}
                    onChange={(e) => setRoyaltyPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    min={0} max={100}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4564]/50"
                  />
                </div>
              </div>

              {/* Attributes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-[var(--color-text-secondary)]">Attributes</label>
                  <button onClick={addAttribute} className="text-xs text-[#FF4564] hover:text-[#FF4564]/80">
                    + Add
                  </button>
                </div>
                {attributes.map((attr, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={attr.trait_type}
                      onChange={(e) => {
                        const updated = [...attributes];
                        updated[i] = { ...updated[i], trait_type: e.target.value };
                        setAttributes(updated);
                      }}
                      placeholder="Trait"
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4564]/50"
                    />
                    <input
                      type="text"
                      value={String(attr.value)}
                      onChange={(e) => {
                        const updated = [...attributes];
                        updated[i] = { ...updated[i], value: e.target.value };
                        setAttributes(updated);
                      }}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4564]/50"
                    />
                    <button
                      onClick={() => removeAttribute(i)}
                      className="px-2 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Mint Button */}
              <button
                onClick={handleMint}
                disabled={!activeWallet || !name.trim()}
                className="w-full bg-[#FF4564] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                Upload to IPFS & Mint (~0.003 SOL)
              </button>

              {!activeWallet && (
                <p className="text-xs text-center text-yellow-400">
                  Connect your wallet to mint
                </p>
              )}
            </>
          )}

          {(step === 'uploading' || step === 'minting') && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
              <div>
                <p className="font-medium">
                  {step === 'uploading' ? 'Uploading to IPFS...' : 'Minting on Solana...'}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {step === 'uploading'
                    ? 'Uploading your artwork and metadata to decentralized storage'
                    : 'Confirm the transaction in your wallet'}
                </p>
              </div>
            </div>
          )}

          {step === 'done' && mintResult && (
            <div className="py-8 text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <div>
                <p className="font-semibold text-lg">NFT Minted! 🎉</p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Your NFT is now live on Solana
                </p>
              </div>

              <div className="glass rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Mint</span>
                  <span className="font-mono text-xs">{mintResult.mint.slice(0, 8)}...{mintResult.mint.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Metadata</span>
                  <span className="font-mono text-xs truncate max-w-[200px]">{mintResult.metadataUri}</span>
                </div>
              </div>

              <a
                href={mintResult.explorer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View on Solana Explorer
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
