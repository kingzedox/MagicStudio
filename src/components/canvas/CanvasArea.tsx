'use client';

import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Circle, Star, Line, Image, RegularPolygon, Transformer } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { Square, Circle as CircleIcon, X } from 'lucide-react';
import type { CanvasElement, ElementType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 768;
const MAX_UNDO_HISTORY = 50;

interface CanvasAreaProps {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  activeTool: ElementType | 'select' | 'eraser';
  brushColor: string;
  brushSize: number;
  canvasBg: string;
  onAddCommit: (desc: string) => void;
  setActiveTool: (tool: ElementType | 'select' | 'eraser') => void;
}

export interface CanvasAreaHandle {
  getStage: () => Konva.Stage | null;
  undo: () => void;
  redo: () => void;
}

function KonvaImageItem({ el, isSelected, onSelect, onDragEnd }: {
  el: CanvasElement;
  isSelected: boolean;
  onSelect: (e: KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!el.imageUrl) return;
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = el.imageUrl;
    img.onload = () => setImage(img);
  }, [el.imageUrl]);

  return (
    <Image
      id={el.id}
      image={image || undefined}
      x={el.x}
      y={el.y}
      width={el.w}
      height={el.h}
      rotation={el.rotation || 0}
      opacity={el.opacity ?? 1}
      draggable={!el.locked}
      onClick={onSelect}
      onDragEnd={onDragEnd}
      fill={el.color}
    />
  );
}

const CanvasArea = forwardRef<CanvasAreaHandle, CanvasAreaProps>(function CanvasArea(
  { elements, setElements, selectedIds, setSelectedIds, activeTool, brushColor, brushSize, canvasBg, onAddCommit, setActiveTool },
  ref
) {
  const trRef = useRef<Konva.Transformer | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const isDrawing = useRef(false);
  const currentLine = useRef<number[]>([]);
  const drawingStartPos = useRef({ x: 0, y: 0 });
  const [smartShapePrompt, setSmartShapePrompt] = useState<{ id: string; x: number; y: number; w: number; h: number } | null>(null);
  
  // Smart Guides State
  const [guides, setGuides] = useState<{ type: 'horizontal' | 'vertical', lineGuide: number }[]>([]);

  // Selection Box State
  const isSelectionBox = useRef(false);
  const selectionStartPos = useRef({ x: 0, y: 0 });
  const [selectionBoxRect, setSelectionBoxRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  // Undo / Redo
  const historyRef = useRef<CanvasElement[][]>([elements]);
  const historyIndexRef = useRef(0);
  const isUndoRedo = useRef(false);

  useEffect(() => {
    if (isUndoRedo.current) { isUndoRedo.current = false; return; }
    const curr = historyRef.current[historyIndexRef.current];
    if (JSON.stringify(curr) !== JSON.stringify(elements)) {
      let sliced = historyRef.current.slice(0, historyIndexRef.current + 1);
      sliced.push(elements);
      if (sliced.length > MAX_UNDO_HISTORY) sliced = sliced.slice(sliced.length - MAX_UNDO_HISTORY);
      historyRef.current = sliced;
      historyIndexRef.current = sliced.length - 1;
    }
  }, [elements]);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      isUndoRedo.current = true;
      setElements(historyRef.current[historyIndexRef.current]);
    }
  }, [setElements]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      isUndoRedo.current = true;
      setElements(historyRef.current[historyIndexRef.current]);
    }
  }, [setElements]);

  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
    undo: handleUndo,
    redo: handleRedo,
  }));

  // Update transformer selection
  useEffect(() => {
    if (trRef.current && layerRef.current) {
      if (selectedIds.length > 0 && activeTool === 'select') {
        const nodes = selectedIds
          .map(id => layerRef.current!.findOne(`#${id}`))
          .filter(Boolean) as Konva.Node[];
        
        // Filter out locked elements
        const unlockedNodes = nodes.filter(node => {
          const el = elements.find(e => e.id === node.id());
          return el && !el.locked;
        });

        if (unlockedNodes.length > 0) {
          trRef.current.nodes(unlockedNodes);
          trRef.current.getLayer()?.batchDraw();
          return;
        }
      }
      trRef.current.nodes([]);
    }
  }, [selectedIds, elements, activeTool]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? handleRedo() : handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); handleRedo(); return; }
      if (selectedIds.length > 0 && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
        setSelectedIds([]);
        onAddCommit('Deleted elements');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, handleUndo, handleRedo, setElements, setSelectedIds, onAddCommit]);

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const clickedOnEmpty = e.target === stage;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (activeTool === 'select') {
      if (clickedOnEmpty) {
        setSelectedIds([]);
        isSelectionBox.current = true;
        selectionStartPos.current = { x: pos.x, y: pos.y };
        setSelectionBoxRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      }
      return;
    }

    if (activeTool === 'freehand' || activeTool === 'eraser') {
      isDrawing.current = true;
      currentLine.current = [pos.x, pos.y];
      const newEl: CanvasElement = {
        id: uuidv4(),
        type: activeTool as ElementType,
        x: 0, y: 0, w: 0, h: 0,
        color: brushColor,
        strokeWidth: activeTool === 'eraser' ? brushSize * 3 : brushSize,
        points: [pos.x, pos.y],
      };
      setElements(prev => [...prev, newEl]);
      return;
    }

    // Initialize drawing a shape
    isDrawing.current = true;
    drawingStartPos.current = { x: pos.x, y: pos.y };
    
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: activeTool as ElementType,
      x: pos.x,
      y: pos.y,
      w: 0,
      h: 0,
      color: brushColor,
      text: activeTool === 'text' ? 'Double-click to edit' : undefined,
      fontSize: activeTool === 'text' ? 24 : undefined,
      fontFamily: activeTool === 'text' ? 'Inter' : undefined,
    };
    setElements(prev => [...prev, newElement]);
    setSelectedIds([newElement.id]);
  };

  const handleStageMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (isSelectionBox.current && selectionBoxRect) {
      setSelectionBoxRect({
        x: Math.min(pos.x, selectionStartPos.current.x),
        y: Math.min(pos.y, selectionStartPos.current.y),
        w: Math.abs(pos.x - selectionStartPos.current.x),
        h: Math.abs(pos.y - selectionStartPos.current.y),
      });
      return;
    }

    if (!isDrawing.current) return;

    if (activeTool === 'freehand' || activeTool === 'eraser') {
      currentLine.current = [...currentLine.current, pos.x, pos.y];
      setElements(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && (last.type === 'freehand' || last.type === 'eraser')) {
          updated[updated.length - 1] = { ...last, points: [...currentLine.current] };
        }
        return updated;
      });
    } else {
      setElements(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && selectedIds.includes(last.id)) {
          const dx = pos.x - drawingStartPos.current.x;
          const dy = pos.y - drawingStartPos.current.y;
          updated[updated.length - 1] = { 
            ...last, 
            x: dx < 0 ? pos.x : drawingStartPos.current.x,
            y: dy < 0 ? pos.y : drawingStartPos.current.y,
            w: Math.abs(dx), 
            h: Math.abs(dy) 
          };
        }
        return updated;
      });
    }
  };

  const handleStageMouseUp = () => {
    if (isSelectionBox.current && selectionBoxRect) {
      isSelectionBox.current = false;
      const box = selectionBoxRect;
      const selected = elements.filter(el => {
        const ex = el.x;
        const ey = el.y;
        const ew = el.w || (el.type === 'circle' || el.type === 'star' || el.type === 'triangle' ? el.w * 2 : 0) || 50;
        const eh = el.h || (el.type === 'circle' || el.type === 'star' || el.type === 'triangle' ? el.h * 2 : 0) || 50;
        return !(box.x > ex + ew || box.x + box.w < ex || box.y > ey + eh || box.y + box.h < ey);
      }).map(el => el.id);
      setSelectedIds(selected);
      setSelectionBoxRect(null);
      return;
    }

    if (isDrawing.current) {
      isDrawing.current = false;
      
      if (activeTool === 'freehand' && currentLine.current.length > 20) {
        const pts = currentLine.current;
        const startX = pts[0], startY = pts[1];
        const endX = pts[pts.length - 2], endY = pts[pts.length - 1];
        
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        let minX = pts[0], maxX = pts[0], minY = pts[1], maxY = pts[1];
        for (let i = 0; i < pts.length; i += 2) {
          minX = Math.min(minX, pts[i]);
          maxX = Math.max(maxX, pts[i]);
          minY = Math.min(minY, pts[i+1]);
          maxY = Math.max(maxY, pts[i+1]);
        }
        const w = maxX - minX;
        const h = maxY - minY;
        
        // Stricter heuristic: Start and end must be within 30 pixels of each other (true closed loop)
        const isClosedLoop = distance < 30;
        const isReasonableSize = w > 30 && h > 30;
        
        if (isClosedLoop && isReasonableSize) {
          const lastElement = elements[elements.length - 1];
          if (lastElement && lastElement.type === 'freehand') {
            setSmartShapePrompt({ id: lastElement.id, x: minX, y: minY, w, h });
          }
        }
      }
      
      currentLine.current = [];
      onAddCommit(`Drew ${activeTool}`);

      // Auto-switch to select mode so the newly drawn shape gets its bounding box
      if (activeTool !== 'freehand') {
        setActiveTool('select');
      }
    }
  };

  const convertToShape = (type: 'rect' | 'circle') => {
    if (!smartShapePrompt) return;
    setElements(prev => prev.map(el => {
      if (el.id === smartShapePrompt.id) {
        return {
          ...el,
          type,
          points: undefined,
          x: type === 'circle' ? smartShapePrompt.x + smartShapePrompt.w / 2 : smartShapePrompt.x,
          y: type === 'circle' ? smartShapePrompt.y + smartShapePrompt.h / 2 : smartShapePrompt.y,
          w: smartShapePrompt.w,
          h: smartShapePrompt.h,
          strokeWidth: 0,
        };
      }
      return el;
    }));
    setSmartShapePrompt(null);
    onAddCommit(`Refined shape to ${type}`);
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>, id: string) => {
    setGuides([]); // clear guides
    const node = e.target;
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, x: node.x(), y: node.y() } : el
    ));
    onAddCommit('Moved element');
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>, id: string) => {
    const node = e.target;
    const SNAP_THRESHOLD = 10;
    
    // Node bounding box
    const box = node.getClientRect();
    const boxCenterX = box.x + box.width / 2;
    const boxCenterY = box.y + box.height / 2;
    
    // Collect all possible X and Y snap lines from the environment
    const targetXs: number[] = [CANVAS_WIDTH / 2, 0, CANVAS_WIDTH];
    const targetYs: number[] = [CANVAS_HEIGHT / 2, 0, CANVAS_HEIGHT];
    
    elements.forEach(el => {
      if (el.id === id || selectedIds.includes(el.id)) return;
      const elNode = layerRef.current?.findOne(`#${el.id}`);
      if (!elNode) return;
      const elBox = elNode.getClientRect();
      if (elBox.width === 0 || elBox.height === 0) return;
      
      targetXs.push(elBox.x, elBox.x + elBox.width / 2, elBox.x + elBox.width);
      targetYs.push(elBox.y, elBox.y + elBox.height / 2, elBox.y + elBox.height);
    });

    // Find the closest snap for X and Y
    let bestSnapX: { diff: number, snapTarget: number, nodeSnapPoint: number } | null = null;
    let bestSnapY: { diff: number, snapTarget: number, nodeSnapPoint: number } | null = null;

    const nodeXs = [box.x, boxCenterX, box.x + box.width];
    const nodeYs = [box.y, boxCenterY, box.y + box.height];

    targetXs.forEach(tx => {
      nodeXs.forEach(nx => {
        const diff = Math.abs(tx - nx);
        if (diff < SNAP_THRESHOLD) {
          if (!bestSnapX || diff < bestSnapX.diff) {
            bestSnapX = { diff, snapTarget: tx, nodeSnapPoint: nx };
          }
        }
      });
    });

    targetYs.forEach(ty => {
      nodeYs.forEach(ny => {
        const diff = Math.abs(ty - ny);
        if (diff < SNAP_THRESHOLD) {
          if (!bestSnapY || diff < bestSnapY.diff) {
            bestSnapY = { diff, snapTarget: ty, nodeSnapPoint: ny };
          }
        }
      });
    });

    const newGuides: { type: 'horizontal' | 'vertical', lineGuide: number }[] = [];

    if (bestSnapX) {
      node.x(node.x() + (bestSnapX.snapTarget - bestSnapX.nodeSnapPoint));
      newGuides.push({ type: 'vertical', lineGuide: bestSnapX.snapTarget });
    }
    if (bestSnapY) {
      node.y(node.y() + (bestSnapY.snapTarget - bestSnapY.nodeSnapPoint));
      newGuides.push({ type: 'horizontal', lineGuide: bestSnapY.snapTarget });
    }

    setGuides(newGuides);
  };

  const handleTransformEnd = () => {
    if (!trRef.current) return;
    const nodes = trRef.current.nodes();
    setElements(prev => prev.map(el => {
      const node = nodes.find(n => n.id() === el.id);
      if (node) {
        return {
          ...el,
          x: node.x(), y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation(),
        };
      }
      return el;
    }));
    onAddCommit('Transformed element');
  };

  const handleElementClick = (el: CanvasElement, e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (activeTool === 'select') {
      if (e.evt.shiftKey || e.evt.metaKey) {
        setSelectedIds(prev => prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]);
      } else {
        setSelectedIds([el.id]);
      }
    } else if (activeTool !== 'eraser') {
      // Auto-switch to select mode if clicking a shape with another tool
      setSelectedIds([el.id]);
      setActiveTool('select');
    }
  };

  return (
    <div className="flex-1 overflow-auto flex items-center justify-center bg-[var(--color-surface)] relative select-none">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(#666 1px, transparent 1px), linear-gradient(90deg, #666 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="shadow-2xl overflow-visible relative shrink-0" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        
        {smartShapePrompt && (
          <div 
            className="absolute z-50 flex gap-2 items-center bg-[var(--color-surface)] shadow-lg border border-[var(--color-border)] rounded-full px-4 py-2 animate-in fade-in zoom-in duration-200"
            style={{ left: smartShapePrompt.x + smartShapePrompt.w / 2, top: smartShapePrompt.y - 50, transform: 'translateX(-50%)' }}
          >
            <span className="text-xs font-semibold mr-2 flex items-center text-[var(--color-text-secondary)]">Refine:</span>
            <button onClick={() => convertToShape('rect')} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-sm text-[var(--color-text)]" title="Rectangle">
              <Square className="w-4 h-4" />
            </button>
            <button onClick={() => convertToShape('circle')} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-sm text-[var(--color-text)]" title="Circle">
              <CircleIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-[var(--color-border)] mx-1" />
            <button onClick={() => setSmartShapePrompt(null)} className="p-1.5 hover:bg-white/10 rounded-md text-red-400 transition-colors text-sm" title="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="w-full h-full rounded-br-lg overflow-hidden border border-white/10" style={{ background: canvasBg }}>
          <Stage
            ref={stageRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onTouchStart={handleStageMouseDown as unknown as (e: KonvaEventObject<TouchEvent>) => void}
            onTouchMove={handleStageMouseMove as unknown as (e: KonvaEventObject<TouchEvent>) => void}
            onTouchEnd={handleStageMouseUp as unknown as (e: KonvaEventObject<TouchEvent>) => void}
          >
          <Layer ref={layerRef}>
            {elements.map(el => {
              const baseProps = {
                id: el.id,
                x: el.x,
                y: el.y,
                scaleX: el.scaleX || 1,
                scaleY: el.scaleY || 1,
                rotation: el.rotation || 0,
                opacity: el.opacity ?? 1,
                stroke: el.stroke,
                strokeWidth: el.strokeWidth || 0,
                draggable: activeTool === 'select' && !el.locked,
                onClick: (e: KonvaEventObject<MouseEvent>) => handleElementClick(el, e),
                onDragMove: (e: KonvaEventObject<DragEvent>) => handleDragMove(e, el.id),
                onDragEnd: (e: KonvaEventObject<DragEvent>) => handleDragEnd(e, el.id),
                onTransformEnd: handleTransformEnd,
                fill: el.color,
              };
              switch (el.type) {
                case 'rect':
                  return <Rect key={el.id} {...baseProps} width={el.w} height={el.h} cornerRadius={el.cornerRadius ?? 4} />;
                case 'circle':
                  return <Circle key={el.id} {...baseProps} radius={Math.min(el.w, el.h) / 2} />;
                case 'star':
                  return <Star key={el.id} {...baseProps} numPoints={5} innerRadius={el.w / 4} outerRadius={el.w / 2} />;
                case 'triangle':
                  return <RegularPolygon key={el.id} {...baseProps} sides={3} radius={el.w / 2} />;
                case 'text':
                  return (
                    <Text
                      key={el.id}
                      {...baseProps}
                      text={el.text || 'Text'}
                      fontSize={el.fontSize || 24}
                      fontFamily={el.fontFamily || 'Inter'}
                      fontStyle={el.fontStyle || 'normal'}
                      width={el.w}
                    />
                  );
                case 'image':
                  return (
                    <KonvaImageItem
                      key={el.id}
                      el={el}
                      isSelected={selectedIds.includes(el.id)}
                      onSelect={(e) => handleElementClick(el, e)}
                      onDragEnd={(e) => handleDragEnd(e, el.id)}
                    />
                  );
                case 'freehand':
                case 'eraser':
                  return (
                    <Line
                      key={el.id}
                      id={el.id}
                      points={el.points || []}
                      stroke={el.color}
                      strokeWidth={el.strokeWidth || 3}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation={el.type === 'eraser' ? 'destination-out' : 'source-over'}
                      opacity={el.opacity ?? 1}
                      onClick={(e: KonvaEventObject<MouseEvent>) => handleElementClick(el, e)}
                    />
                  );
                default:
                  return null;
              }
            })}
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
              }
            />
            {/* Render Selection Box */}
            {selectionBoxRect && (
              <Rect
                x={selectionBoxRect.x}
                y={selectionBoxRect.y}
                width={selectionBoxRect.w}
                height={selectionBoxRect.h}
                fill="rgba(255, 69, 100, 0.1)"
                stroke="#FF4564"
                strokeWidth={1}
              />
            )}
            
            {/* Render Smart Guides */}
            {guides.map((guide, i) => (
              <Line
                key={`guide-${i}`}
                points={
                  guide.type === 'horizontal' 
                    ? [0, guide.lineGuide, CANVAS_WIDTH, guide.lineGuide] 
                    : [guide.lineGuide, 0, guide.lineGuide, CANVAS_HEIGHT]
                }
                stroke="#FF4564"
                strokeWidth={1}
                dash={[4, 4]}
              />
            ))}
          </Layer>
        </Stage>
        </div>
      </div>
    </div>
  );
});

export default CanvasArea;
