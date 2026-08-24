'use client';

import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Circle, Star, Line, Image, RegularPolygon, Transformer } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { CanvasElement, ElementType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 768;
const MAX_UNDO_HISTORY = 50;

interface CanvasAreaProps {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  activeTool: ElementType | 'select' | 'eraser';
  brushColor: string;
  brushSize: number;
  onAddCommit: (desc: string) => void;
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
  { elements, setElements, selectedId, setSelectedId, activeTool, brushColor, brushSize, onAddCommit },
  ref
) {
  const trRef = useRef<Konva.Transformer | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const isDrawing = useRef(false);
  const currentLine = useRef<number[]>([]);

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
      if (selectedId && activeTool === 'select') {
        const node = layerRef.current.findOne(`#${selectedId}`);
        if (node) {
          const el = elements.find(e => e.id === selectedId);
          if (el && !el.locked) {
            trRef.current.nodes([node]);
            trRef.current.getLayer()?.batchDraw();
            return;
          }
        }
      }
      trRef.current.nodes([]);
    }
  }, [selectedId, elements, activeTool]);

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
      if (selectedId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
        onAddCommit('Deleted element');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, handleUndo, handleRedo, setElements, setSelectedId, onAddCommit]);

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const clickedOnEmpty = e.target === stage;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (activeTool === 'select' || activeTool === 'eraser') {
      if (clickedOnEmpty) setSelectedId(null);
      return;
    }

    if (activeTool === 'freehand') {
      isDrawing.current = true;
      currentLine.current = [pos.x, pos.y];
      const newEl: CanvasElement = {
        id: uuidv4(),
        type: 'freehand',
        x: 0, y: 0, w: 0, h: 0,
        color: brushColor,
        strokeWidth: brushSize,
        points: [pos.x, pos.y],
      };
      setElements(prev => [...prev, newEl]);
      return;
    }

    // Create shape at click position
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: activeTool as ElementType,
      x: pos.x - 50,
      y: pos.y - 50,
      w: 100,
      h: 100,
      color: brushColor,
      text: activeTool === 'text' ? 'Double-click to edit' : undefined,
      fontSize: activeTool === 'text' ? 24 : undefined,
      fontFamily: activeTool === 'text' ? 'Inter' : undefined,
    };
    setElements(prev => [...prev, newElement]);
    setSelectedId(newElement.id);
    onAddCommit(`Added ${activeTool}`);
  };

  const handleStageMouseMove = () => {
    if (!isDrawing.current || activeTool !== 'freehand') return;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    currentLine.current = [...currentLine.current, pos.x, pos.y];
    setElements(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last && last.type === 'freehand') {
        updated[updated.length - 1] = { ...last, points: [...currentLine.current] };
      }
      return updated;
    });
  };

  const handleStageMouseUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      currentLine.current = [];
      onAddCommit('Drew freehand');
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>, id: string) => {
    const node = e.target;
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, x: node.x(), y: node.y() } : el
    ));
    onAddCommit('Moved element');
  };

  const handleTransformEnd = () => {
    if (!trRef.current) return;
    const nodes = trRef.current.nodes();
    setElements(prev => prev.map(el => {
      const node = nodes.find(n => n.id() === el.id);
      if (node) {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        return {
          ...el,
          x: node.x(), y: node.y(),
          w: Math.max(10, node.width() * scaleX),
          h: Math.max(10, node.height() * scaleY),
          rotation: node.rotation(),
        };
      }
      return el;
    }));
    onAddCommit('Transformed element');
  };

  const handleElementClick = (el: CanvasElement, e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (activeTool === 'eraser') {
      setElements(prev => prev.filter(item => item.id !== el.id));
      onAddCommit('Erased element');
      return;
    }
    if (activeTool === 'select') {
      setSelectedId(el.id);
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

      <div className="shadow-2xl rounded-lg overflow-hidden relative shrink-0" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
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
          style={{ background: '#1a1a2e' }}
        >
          <Layer ref={layerRef}>
            {elements.map(el => {
              const baseProps = {
                id: el.id,
                x: el.x,
                y: el.y,
                rotation: el.rotation || 0,
                opacity: el.opacity ?? 1,
                stroke: el.stroke,
                strokeWidth: el.strokeWidth || 0,
                draggable: activeTool === 'select' && !el.locked,
                onClick: (e: KonvaEventObject<MouseEvent>) => handleElementClick(el, e),
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
                      isSelected={selectedId === el.id}
                      onSelect={(e) => handleElementClick(el, e)}
                      onDragEnd={(e) => handleDragEnd(e, el.id)}
                    />
                  );
                case 'freehand':
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
                      globalCompositeOperation="source-over"
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
          </Layer>
        </Stage>
      </div>
    </div>
  );
});

export default CanvasArea;
