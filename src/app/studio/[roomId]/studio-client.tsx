'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { v4 as uuidv4 } from 'uuid';
import {
  ArrowLeft, Download, Share2, Sparkles, Wand2,
  Square, Circle, Type, Image as ImageIcon, Pen,
  Star, Triangle, Eraser, Undo2, Redo2, Trash2, Lock, Unlock,
} from 'lucide-react';
import type { CanvasElement, TimelineEvent, ElementType } from '@/types';
import Toast from '@/components/shared/Toast';
import { useToast } from '@/hooks/useToast';
import CanvasArea, { type CanvasAreaHandle } from '@/components/canvas/CanvasArea';
import MintPanel from '@/components/nft/MintPanel';

const TOOLS: { type: ElementType | 'select' | 'eraser'; icon: React.ReactNode; label: string }[] = [
  { type: 'select', icon: <span className="text-sm cursor-pointer">↖</span>, label: 'Select' },
  { type: 'freehand', icon: <Pen className="w-4 h-4" />, label: 'Draw' },
  { type: 'rect', icon: <Square className="w-4 h-4" />, label: 'Rectangle' },
  { type: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Circle' },
  { type: 'triangle', icon: <Triangle className="w-4 h-4" />, label: 'Triangle' },
  { type: 'star', icon: <Star className="w-4 h-4" />, label: 'Star' },
  { type: 'text', icon: <Type className="w-4 h-4" />, label: 'Text' },
  { type: 'image', icon: <ImageIcon className="w-4 h-4" />, label: 'Image' },
  { type: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Eraser' },
];

interface StudioClientProps {
  roomId: string;
}

export default function StudioClient({ roomId }: StudioClientProps) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { toasts, hideToast, success, error, loading } = useToast();

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ElementType | 'select' | 'eraser'>('select');
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(3);
  const [showMintPanel, setShowMintPanel] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([{
    id: uuidv4(),
    version: 'v1.0',
    description: 'Studio initialized',
    timestamp: new Date().toISOString(),
    type: 'creation',
  }]);

  const canvasRef = useRef<CanvasAreaHandle>(null);

  const addTimelineEvent = useCallback((desc: string, type: TimelineEvent['type'] = 'edit') => {
    setTimeline(prev => [{
      id: uuidv4(),
      version: `v${(1.0 + prev.length * 0.1).toFixed(1)}`,
      description: desc,
      timestamp: new Date().toISOString(),
      type,
    }, ...prev]);
  }, []);

  const handleExportPNG = () => {
    const stage = canvasRef.current?.getStage();
    if (!stage) return error('Canvas not ready');
    try {
      const dataURL = stage.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `magicstudio-${roomId}.png`;
      link.href = dataURL;
      link.click();
      success('Exported as PNG!');
    } catch (err: unknown) {
      error(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      success('Room link copied to clipboard!');
    } catch {
      // Fallback for non-HTTPS
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      success('Room link copied!');
    }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)] overflow-hidden">
      {/* Toast stack */}
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => hideToast(t.id)} />
      ))}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] glass shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">{roomId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Share">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={handleExportPNG} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Export PNG">
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowMintPanel(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Mint NFT
          </button>
          <WalletMultiButton />
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className="w-14 border-r border-[var(--color-border)] glass flex flex-col items-center py-3 gap-1 shrink-0">
          {TOOLS.map(tool => (
            <button
              key={tool.type}
              onClick={() => setActiveTool(tool.type)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTool === tool.type
                  ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50'
                  : 'hover:bg-white/5 text-[var(--color-text-secondary)]'
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}

          <div className="w-8 h-px bg-[var(--color-border)] my-2" />

          <button
            onClick={() => canvasRef.current?.undo()}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 text-[var(--color-text-secondary)]"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => canvasRef.current?.redo()}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 text-[var(--color-text-secondary)]"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Color picker */}
          <div className="mt-auto mb-2">
            <label className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] overflow-hidden cursor-pointer block relative">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-full h-full" style={{ background: brushColor }} />
            </label>
          </div>
        </div>

        {/* Canvas */}
        <CanvasArea
          ref={canvasRef}
          elements={elements}
          setElements={setElements}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          activeTool={activeTool}
          brushColor={brushColor}
          brushSize={brushSize}
          onAddCommit={addTimelineEvent}
        />

        {/* Right sidebar — properties */}
        <div className="w-64 border-l border-[var(--color-border)] glass overflow-y-auto shrink-0 hidden lg:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
              Properties
            </h3>

            {selectedElement ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Type</label>
                  <p className="text-sm font-medium capitalize">{selectedElement.type}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)]">X</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) => setElements(els => els.map(el =>
                        el.id === selectedId ? { ...el, x: Number(e.target.value) } : el
                      ))}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)]">Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) => setElements(els => els.map(el =>
                        el.id === selectedId ? { ...el, y: Number(e.target.value) } : el
                      ))}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)]">W</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.w)}
                      onChange={(e) => setElements(els => els.map(el =>
                        el.id === selectedId ? { ...el, w: Number(e.target.value) } : el
                      ))}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)]">H</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.h)}
                      onChange={(e) => setElements(els => els.map(el =>
                        el.id === selectedId ? { ...el, h: Number(e.target.value) } : el
                      ))}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Color</label>
                  <input
                    type="color"
                    value={selectedElement.color || '#6366f1'}
                    onChange={(e) => setElements(els => els.map(el =>
                      el.id === selectedId ? { ...el, color: e.target.value } : el
                    ))}
                    className="w-full h-8 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Opacity</label>
                  <input
                    type="range"
                    min="0" max="1" step="0.05"
                    value={selectedElement.opacity ?? 1}
                    onChange={(e) => setElements(els => els.map(el =>
                      el.id === selectedId ? { ...el, opacity: Number(e.target.value) } : el
                    ))}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setElements(els => els.map(el =>
                        el.id === selectedId ? { ...el, locked: !el.locked } : el
                      ));
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {selectedElement.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {selectedElement.locked ? 'Unlock' : 'Lock'}
                  </button>
                  <button
                    onClick={() => {
                      setElements(els => els.filter(el => el.id !== selectedId));
                      setSelectedId(null);
                      addTimelineEvent('Deleted element');
                    }}
                    className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">
                Select an element to edit its properties
              </p>
            )}

            {/* Brush settings for freehand */}
            {activeTool === 'freehand' && (
              <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                  Brush
                </h3>
                <div>
                  <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">
                    Size: {brushSize}px
                  </label>
                  <input
                    type="range"
                    min="1" max="20" step="1"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
              <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                History
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {timeline.slice(0, 20).map(event => (
                  <div key={event.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[var(--color-text)]">{event.description}</p>
                      <p className="text-[10px] text-[var(--color-text-secondary)]">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mint Panel Overlay */}
      {showMintPanel && (
        <MintPanel
          elements={elements}
          canvasRef={canvasRef}
          roomId={roomId}
          onClose={() => setShowMintPanel(false)}
          onSuccess={(result) => {
            success(`NFT minted! ${result.mint.slice(0, 8)}...`);
            addTimelineEvent(`Minted NFT: ${result.mint.slice(0, 8)}...`, 'mint');
            setShowMintPanel(false);
          }}
        />
      )}
    </div>
  );
}
