'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginButton from '@/components/shared/LoginButton';
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
  const { toasts, hideToast, success, error, loading } = useToast();

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<ElementType | 'select' | 'eraser'>('select');
  const [brushColor, setBrushColor] = useState('#FF4564');
  const [brushSize, setBrushSize] = useState(3);
  const [canvasBg, setCanvasBg] = useState('#1a1a2e');
  const [showMintPanel, setShowMintPanel] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setTimeline([{
      id: uuidv4(),
      version: 'v1',
      description: 'Canvas created',
      timestamp: new Date().toISOString(),
      type: 'creation'
    }]);
  }, []);

  const canvasRef = useRef<CanvasAreaHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (toolType: ElementType | 'select' | 'eraser') => {
    if (toolType === 'image') {
      fileInputRef.current?.click();
    }
    setActiveTool(toolType);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: 'image',
      x: 100,
      y: 100,
      w: 300,
      h: 300, // Will be overridden by natural aspect ratio if wanted
      color: '#ffffff',
      imageUrl: url,
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedIds([newElement.id]);
    setActiveTool('select');
    addTimelineEvent('Added image');
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

  const selectedElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;

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
            <div className="w-6 h-6 rounded-md bg-[#FF4564] flex items-center justify-center">
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
            className="px-4 py-2 bg-[#FF4564] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Mint NFT
          </button>
          <LoginButton />
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className="w-14 border-r border-[var(--color-border)] glass flex flex-col items-center py-3 gap-1 shrink-0">
          {TOOLS.map(tool => (
            <button
              key={tool.type}
              onClick={() => handleToolClick(tool.type)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTool === tool.type
                  ? 'bg-[#FF4564]/20 text-[#FF4564] ring-1 ring-[#FF4564]/50'
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

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* Canvas */}
        <CanvasArea
          ref={canvasRef}
          elements={elements}
          setElements={setElements}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          activeTool={activeTool}
          brushColor={brushColor}
          brushSize={brushSize}
          canvasBg={canvasBg}
          onAddCommit={addTimelineEvent}
          setActiveTool={setActiveTool}
        />

        {/* Right sidebar — properties */}
        <div className="w-64 border-l border-[var(--color-border)] glass overflow-y-auto shrink-0 hidden lg:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
              Properties
            </h3>

            {/* Canvas Background Settings */}
            <div className="mb-6">
              <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">Canvas Background</label>
              <div className="flex gap-2">
                {['#1a1a2e', '#ffffff', '#e5e7eb', '#000000'].map(bg => (
                  <button
                    key={bg}
                    onClick={() => setCanvasBg(bg)}
                    className={`w-6 h-6 rounded-full border-2 ${canvasBg === bg ? 'border-[#FF4564]' : 'border-transparent'} shadow-sm`}
                    style={{ background: bg }}
                    title={`Set background to ${bg}`}
                  />
                ))}
                <label className="w-6 h-6 rounded-full border-2 border-dashed border-[var(--color-border)] flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                  <input
                    type="color"
                    value={canvasBg}
                    onChange={(e) => setCanvasBg(e.target.value)}
                    className="absolute opacity-0 w-0 h-0"
                  />
                  <span className="text-[10px] text-[var(--color-text-secondary)]">+</span>
                </label>
              </div>
            </div>

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
                        selectedIds.includes(el.id) ? { ...el, x: Number(e.target.value) } : el
                      ))}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4564]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)]">Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) => setElements(els => els.map(el =>
                        selectedIds.includes(el.id) ? { ...el, y: Number(e.target.value) } : el
                      ))}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4564]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)]">W</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.w)}
                      onChange={(e) => setElements(els => els.map(el =>
                        selectedIds.includes(el.id) ? { ...el, w: Number(e.target.value) } : el
                      ))}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4564]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)]">H</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.h)}
                      onChange={(e) => setElements(els => els.map(el =>
                        selectedIds.includes(el.id) ? { ...el, h: Number(e.target.value) } : el
                      ))}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4564]/50"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">Color</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['#FF4564', '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ffffff', '#000000'].map(color => (
                      <button
                        key={color}
                        onClick={() => setElements(els => els.map(el => selectedIds.includes(el.id) ? { ...el, color } : el))}
                        className={`w-6 h-6 rounded-full border-2 ${selectedElement?.color === color ? 'border-white' : 'border-transparent'} shadow-sm`}
                        style={{ background: color }}
                        title={`Set color to ${color}`}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={selectedElement?.color || '#FF4564'}
                    onChange={(e) => setElements(els => els.map(el =>
                      selectedIds.includes(el.id) ? { ...el, color: e.target.value } : el
                    ))}
                    className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Opacity</label>
                  <input
                    type="range"
                    min="0" max="1" step="0.05"
                    value={selectedElement?.opacity ?? 1}
                    onChange={(e) => setElements(els => els.map(el =>
                      selectedIds.includes(el.id) ? { ...el, opacity: Number(e.target.value) } : el
                    ))}
                    className="w-full accent-[#FF4564]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setElements(els => els.map(el =>
                        selectedIds.includes(el.id) ? { ...el, locked: !el.locked } : el
                      ));
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {selectedElement?.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {selectedElement?.locked ? 'Unlock' : 'Lock'}
                  </button>
                  <button
                    onClick={() => {
                      setElements(els => els.filter(el => !selectedIds.includes(el.id)));
                      setSelectedIds([]);
                      addTimelineEvent('Deleted element');
                    }}
                    className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : selectedIds.length > 1 ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--color-text-secondary)] font-medium bg-[#FF4564]/10 text-[#FF4564] px-3 py-2 rounded-lg">
                  {selectedIds.length} items selected
                </p>
                <div className="mb-4">
                  <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">Batch Color</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['#FF4564', '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ffffff', '#000000'].map(color => (
                      <button
                        key={color}
                        onClick={() => setElements(els => els.map(el => selectedIds.includes(el.id) ? { ...el, color } : el))}
                        className={`w-6 h-6 rounded-full border-2 border-transparent shadow-sm hover:scale-110 transition-transform`}
                        style={{ background: color }}
                        title={`Set color to ${color}`}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    onChange={(e) => setElements(els => els.map(el =>
                      selectedIds.includes(el.id) ? { ...el, color: e.target.value } : el
                    ))}
                    className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setElements(els => els.filter(el => !selectedIds.includes(el.id)));
                      setSelectedIds([]);
                      addTimelineEvent('Batch deleted elements');
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete All
                  </button>
                </div>
              </div>
            ) : activeTool === 'freehand' || activeTool === 'rect' || activeTool === 'circle' || activeTool === 'star' || activeTool === 'triangle' ? (
              <div className="space-y-4">
                <div className="mb-4">
                  <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">Tool Color</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['#FF4564', '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ffffff', '#000000'].map(color => (
                      <button
                        key={color}
                        onClick={() => setBrushColor(color)}
                        className={`w-6 h-6 rounded-full border-2 ${brushColor === color ? 'border-white' : 'border-transparent'} shadow-sm`}
                        style={{ background: color }}
                        title={`Set color to ${color}`}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                </div>
                {activeTool === 'freehand' && (
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">
                      Brush Size: {brushSize}px
                    </label>
                    <input
                      type="range"
                      min="1" max="20" step="1"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full accent-[#FF4564]"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">
                Select an element to edit its properties
              </p>
            )}



            {/* Timeline */}
            <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
              <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                History
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {timeline.slice(0, 20).map(event => (
                  <div key={event.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF4564] mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[var(--color-text)]">{event.description}</p>
                      <p className="text-[10px] text-[var(--color-text-secondary)]" suppressHydrationWarning>
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
