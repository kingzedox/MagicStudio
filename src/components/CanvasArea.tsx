import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Rect, Text, Transformer, Circle, Star, Image, RegularPolygon } from "react-konva";
import { CanvasElement } from "../types";
import { CANVAS_WIDTH, CANVAS_HEIGHT, MAX_UNDO_HISTORY } from "../constants";

interface CanvasAreaProps {
  elements: CanvasElement[];
  setElements: (els: CanvasElement[]) => void;
  selectedIds?: string[];
  setSelectedIds?: (ids: string[]) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onAddCommit: (desc: string) => void;
  theme?: 'dark' | 'light';
  onUpdateElement?: (element: CanvasElement) => void;
}

export interface CanvasAreaHandle {
  getStage: () => any;
  undo: () => void;
  redo: () => void;
}

function KonvaImageItem({ el, commonProps }: { el: CanvasElement; commonProps: any }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!el.imageUrl) return;
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = el.imageUrl;
    img.onload = () => setImage(img);
  }, [el.imageUrl]);

  return (
    <Image
      {...commonProps}
      image={image || undefined}
      width={el.w}
      height={el.h}
      shadowColor="rgba(0,0,0,0.3)"
      shadowBlur={10}
      shadowOpacity={0.5}
      shadowOffsetY={4}
    />
  );
}

const CanvasArea = forwardRef(function CanvasArea({
  elements,
  setElements,
  selectedIds = [],
  setSelectedIds,
  selectedId,
  setSelectedId,
  onAddCommit,
  theme = 'dark',
  onUpdateElement
}: CanvasAreaProps, ref: React.Ref<CanvasAreaHandle>) {
  const trRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);


  
  // Inline text editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Drag selection box state
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Undo / Redo History Stack with limit
  const historyRef = useRef<CanvasElement[][]>([elements]);
  const historyIndexRef = useRef<number>(0);
  const isUndoRedoAction = useRef<boolean>(false);

  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    const currentHist = historyRef.current[historyIndexRef.current];
    if (JSON.stringify(currentHist) !== JSON.stringify(elements)) {
      let sliced = historyRef.current.slice(0, historyIndexRef.current + 1);
      sliced.push(elements);
      
      // Limit history to MAX_UNDO_HISTORY entries
      if (sliced.length > MAX_UNDO_HISTORY) {
        sliced = sliced.slice(sliced.length - MAX_UNDO_HISTORY);
      }
      
      historyRef.current = sliced;
      historyIndexRef.current = sliced.length - 1;
    }
  }, [elements]);

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      isUndoRedoAction.current = true;
      setElements(historyRef.current[historyIndexRef.current]);
      onAddCommit("Undo action");
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      isUndoRedoAction.current = true;
      setElements(historyRef.current[historyIndexRef.current]);
      onAddCommit("Redo action");
    }
  };

  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
    undo: () => handleUndo(),
    redo: () => handleRedo(),
  }));

  const effectiveSelectedIds = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);

  const updateSelection = (ids: string[]) => {
    if (setSelectedIds) {
      setSelectedIds(ids);
    } else {
      setSelectedId(ids.length > 0 ? ids[ids.length - 1] : null);
    }
  };

  useEffect(() => {
    if (trRef.current && layerRef.current) {
      if (effectiveSelectedIds.length > 0 && !editingId) {
        const nodes = effectiveSelectedIds
          .map(id => layerRef.current.findOne(`#${id}`))
          .filter(node => {
            if (!node) return false;
            const el = elements.find(e => e.id === node.id());
            return el && !el.locked;
          });
        trRef.current.nodes(nodes);
        trRef.current.getLayer()?.batchDraw();
      } else {
        trRef.current.nodes([]);
      }
    }
  }, [effectiveSelectedIds, elements, editingId]);

  // Global Keyboard Shortcuts (Delete, Backspace, Ctrl+A Select All, Ctrl+Z Undo, Arrow Nudge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') return;

      // Undo (Ctrl+Z or Cmd+Z) & Redo (Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl/Cmd+Y)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Select All (Ctrl+A or Cmd+A)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const allUnlocked = elements.filter(el => !el.locked).map(el => el.id);
        updateSelection(allUnlocked);
        return;
      }

      if (effectiveSelectedIds.length === 0) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setElements(elements.filter(el => !effectiveSelectedIds.includes(el.id)));
        updateSelection([]);
        onAddCommit("Deleted selected element(s)");
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        setElements(elements.map(el => {
          if (effectiveSelectedIds.includes(el.id) && !el.locked) {
            let x = el.x;
            let y = el.y;
            if (e.key === 'ArrowLeft') x -= step;
            if (e.key === 'ArrowRight') x += step;
            if (e.key === 'ArrowUp') y -= step;
            if (e.key === 'ArrowDown') y += step;
            return { ...el, x, y };
          }
          return el;
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveSelectedIds, elements, setElements, onAddCommit]);

  const handleStageMouseDown = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setEditingId(null);
      const pos = stageRef.current?.getPointerPosition();
      if (pos) {
        dragStartRef.current = { x: pos.x, y: pos.y };
        setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
      }
      if (!e.evt.shiftKey) {
        updateSelection([]);
      }
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (!dragStartRef.current) return;
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;

    const startX = dragStartRef.current.x;
    const startY = dragStartRef.current.y;

    const x = Math.min(startX, pos.x);
    const y = Math.min(startY, pos.y);
    const width = Math.abs(pos.x - startX);
    const height = Math.abs(pos.y - startY);

    setSelectionBox({ x, y, width, height });
  };

  const handleStageMouseUp = () => {
    if (selectionBox && selectionBox.width > 5 && selectionBox.height > 5) {
      const selX = selectionBox.x;
      const selY = selectionBox.y;
      const selW = selectionBox.width;
      const selH = selectionBox.height;

      const selectedInBox = elements.filter(el => {
        if (el.locked) return false;
        // Check rectangle intersection
        const elX = el.x;
        const elY = el.y;
        const elW = el.w;
        const elH = el.h;

        return (
          elX < selX + selW &&
          elX + elW > selX &&
          elY < selY + selH &&
          elY + elH > selY
        );
      });

      // Include group members
      const finalSelectedIds = new Set<string>();
      selectedInBox.forEach(el => {
        finalSelectedIds.add(el.id);
        if (el.groupId) {
          elements.filter(gEl => gEl.groupId === el.groupId).forEach(gEl => finalSelectedIds.add(gEl.id));
        }
      });

      updateSelection(Array.from(finalSelectedIds));
    }

    dragStartRef.current = null;
    setSelectionBox(null);
  };

  const handleElementClick = (el: CanvasElement, e: any) => {
    e.cancelBubble = true;
    let targetIds = [el.id];

    // If part of a group, expand selection to all elements in the group
    if (el.groupId) {
      targetIds = elements.filter(g => g.groupId === el.groupId).map(g => g.id);
    }

    if (e.evt.shiftKey) {
      const exists = targetIds.every(id => effectiveSelectedIds.includes(id));
      if (exists) {
        updateSelection(effectiveSelectedIds.filter(id => !targetIds.includes(id)));
      } else {
        updateSelection(Array.from(new Set([...effectiveSelectedIds, ...targetIds])));
      }
    } else {
      updateSelection(targetIds);
    }
  };

  const handleDragEnd = (e: any, id: string) => {
    const node = e.target;
    const isMulti = effectiveSelectedIds.includes(id) && effectiveSelectedIds.length > 1;

    let newEls = elements;
    if (isMulti) {
      newEls = elements.map(el => {
        if (effectiveSelectedIds.includes(el.id)) {
          const shapeNode = layerRef.current.findOne(`#${el.id}`);
          if (shapeNode) {
            return { ...el, x: shapeNode.x(), y: shapeNode.y() };
          }
        }
        return el;
      });
      setElements(newEls);
    } else {
      newEls = elements.map(el => {
        if (el.id === id) {
          return { ...el, x: node.x(), y: node.y() };
        }
        return el;
      });
      setElements(newEls);
    }
    onAddCommit("Moved element(s)");
    
    if (onUpdateElement) {
      if (isMulti) {
        effectiveSelectedIds.forEach(selectedId => {
          const el = newEls.find(e => e.id === selectedId);
          if (el) onUpdateElement(el);
        });
      } else {
        const movedElement = newEls.find(el => el.id === id);
        if (movedElement) onUpdateElement(movedElement);
      }
    }
  };

  const handleTransformEnd = () => {
    if (!trRef.current) return;
    const selectedNodes = trRef.current.nodes();

    const newEls = elements.map(el => {
      const matchedNode = selectedNodes.find((n: any) => n.id() === el.id);
      if (matchedNode) {
        const scaleX = matchedNode.scaleX();
        const scaleY = matchedNode.scaleY();
        const rotation = matchedNode.rotation();

        matchedNode.scaleX(1);
        matchedNode.scaleY(1);

        return {
          ...el,
          x: matchedNode.x(),
          y: matchedNode.y(),
          w: Math.max(10, matchedNode.width() * scaleX),
          h: Math.max(10, matchedNode.height() * scaleY),
          rotation: rotation,
        };
      }
      return el;
    });

    setElements(newEls);
    onAddCommit("Transformed element(s)");
    
    if (onUpdateElement) {
      selectedNodes.forEach((node: any) => {
        const transformedEl = newEls.find(el => el.id === node.id());
        if (transformedEl) onUpdateElement(transformedEl);
      });
    }
  };

  const commonProps = (el: CanvasElement) => {
    const baseProps: any = {
      id: el.id,
      x: el.x,
      y: el.y,
      rotation: el.rotation || 0,
      scaleX: el.scaleX || 1,
      scaleY: el.scaleY || 1,
      opacity: el.opacity ?? 1,
      stroke: el.stroke,
      strokeWidth: el.strokeWidth || 0,
      draggable: !el.locked,
      onClick: (e: any) => handleElementClick(el, e),
      onTap: (e: any) => handleElementClick(el, e),
      onDblClick: (e: any) => {
        handleElementClick(el, e);
        if (el.type === 'text') {
          setEditingId(el.id);
        }
      },
      onDragEnd: (e: any) => handleDragEnd(e, el.id),
      onTransformEnd: () => handleTransformEnd(),
    };
    
    // Support gradients
    if (el.gradient) {
      if (el.gradient.type === 'linear') {
        const angle = (el.gradient.angle || 90) * (Math.PI / 180);
        const gradientLength = Math.sqrt(el.w * el.w + el.h * el.h);
        
        baseProps.fillLinearGradientStartPoint = { x: 0, y: 0 };
        baseProps.fillLinearGradientEndPoint = { 
          x: Math.cos(angle) * gradientLength, 
          y: Math.sin(angle) * gradientLength 
        };
        baseProps.fillLinearGradientColorStops = el.gradient.stops.flatMap(stop => [stop.offset, stop.color]);
      } else if (el.gradient.type === 'radial') {
        baseProps.fillRadialGradientStartPoint = { x: el.w / 2, y: el.h / 2 };
        baseProps.fillRadialGradientEndPoint = { x: el.w / 2, y: el.h / 2 };
        baseProps.fillRadialGradientStartRadius = 0;
        baseProps.fillRadialGradientEndRadius = Math.max(el.w, el.h) / 2;
        baseProps.fillRadialGradientColorStops = el.gradient.stops.flatMap(stop => [stop.offset, stop.color]);
      }
    } else {
      baseProps.fill = el.color;
    }

    return baseProps;
  };

  const editingEl = elements.find(e => e.id === editingId);

  const isDark = theme === 'dark';

  return (
    <div className={`flex-1 overflow-auto flex items-center justify-center relative select-none p-2 sm:p-6 transition-colors ${
      isDark ? 'bg-neutral-900' : 'bg-neutral-200'
    }`}>
      {/* Grid Pattern Background */}
      <div 
        className={`absolute inset-0 pointer-events-none ${isDark ? 'opacity-20' : 'opacity-10'}`}
        style={{
          backgroundImage: isDark 
            ? "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)" 
            : "linear-gradient(#666 1px, transparent 1px), linear-gradient(90deg, #666 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
      />
      
      <div className="max-w-full max-h-full flex items-center justify-center overflow-auto">
        {/* Rulers Container */}
        <div className="relative inline-block">
          {/* Horizontal Ruler (Top) */}
          <div 
            className={`absolute top-0 left-6 h-6 ${
              isDark ? 'bg-neutral-900 border-b border-white/10' : 'bg-neutral-50 border-b border-neutral-300'
            }`}
            style={{ width: CANVAS_WIDTH }}
          >
            {Array.from({ length: Math.floor(CANVAS_WIDTH / 50) + 1 }).map((_, i) => {
              const pos = i * 50;
              return (
                <div key={`h-${pos}`} className="absolute" style={{ left: pos }}>
                  <div className={`w-px ${pos % 100 === 0 ? 'h-3' : 'h-2'} ${isDark ? 'bg-white/30' : 'bg-neutral-400'}`} />
                  {pos % 100 === 0 && pos > 0 && (
                    <span className={`absolute top-3.5 left-1 text-[9px] font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>
                      {pos}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Vertical Ruler (Left) */}
          <div 
            className={`absolute top-6 left-0 w-6 ${
              isDark ? 'bg-neutral-900 border-r border-white/10' : 'bg-neutral-50 border-r border-neutral-300'
            }`}
            style={{ height: CANVAS_HEIGHT }}
          >
            {Array.from({ length: Math.floor(CANVAS_HEIGHT / 50) + 1 }).map((_, i) => {
              const pos = i * 50;
              return (
                <div key={`v-${pos}`} className="absolute" style={{ top: pos }}>
                  <div className={`h-px ${pos % 100 === 0 ? 'w-3' : 'w-2'} ml-auto ${isDark ? 'bg-white/30' : 'bg-neutral-400'}`} />
                  {pos % 100 === 0 && pos > 0 && (
                    <span 
                      className={`absolute left-1 text-[9px] font-mono whitespace-nowrap ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}
                      style={{ 
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'left center',
                        top: '10px'
                      }}
                    >
                      {pos}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Corner Square */}
          <div 
            className={`absolute top-0 left-0 w-6 h-6 ${
              isDark ? 'bg-neutral-900 border-r border-b border-white/10' : 'bg-neutral-50 border-r border-b border-neutral-300'
            }`}
          />

          {/* Canvas Container */}
          <div 
            ref={containerRef} 
            className={`ml-6 mt-6 shadow-2xl rounded-sm overflow-hidden relative shrink-0 transition-colors ${
              isDark ? 'bg-neutral-800' : 'bg-white border border-neutral-300'
            }`} 
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          >
        {/* Inline Canvas Text Editor Overlay */}
        {editingEl && editingEl.type === 'text' && (
          <textarea
            autoFocus
            value={editingEl.text || ''}
            onChange={(e) => {
              const val = e.target.value;
              setElements(elements.map(el => el.id === editingEl.id ? { ...el, text: val } : el));
            }}
            onBlur={() => {
              setEditingId(null);
              onAddCommit("Edited text");
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                setEditingId(null);
                onAddCommit("Edited text");
              }
            }}
            style={{
              position: 'absolute',
              left: `${editingEl.x}px`,
              top: `${editingEl.y}px`,
              width: `${Math.max(120, editingEl.w)}px`,
              minHeight: `${Math.max(40, editingEl.h)}px`,
              transform: `rotate(${editingEl.rotation || 0}deg)`,
              color: editingEl.color,
              fontSize: `${editingEl.fontSize || editingEl.h || 24}px`,
              fontFamily: editingEl.fontFamily || 'Arial',
              fontWeight: editingEl.fontStyle?.includes('bold') ? 'bold' : 'normal',
              fontStyle: editingEl.fontStyle?.includes('italic') ? 'italic' : 'normal',
              textAlign: editingEl.align || 'left',
              lineHeight: 1.2,
              background: 'rgba(0,0,0,0.7)',
              border: '2px solid #6366f1',
              borderRadius: '4px',
              padding: '2px 4px',
              outline: 'none',
              zIndex: 100,
              resize: 'both',
            }}
          />
        )}

        <Stage 
          ref={stageRef}
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT} 
          onMouseDown={handleStageMouseDown} 
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onTouchStart={handleStageMouseDown}
          onTouchMove={handleStageMouseMove}
          onTouchEnd={handleStageMouseUp}
        >
          <Layer ref={layerRef}>
            {elements.map((el) => {
              // Hide text element while inline editor is active
              if (el.id === editingId) return null;

              if (el.type === 'rect') {
                return (
                  <Rect
                    key={el.id}
                    {...commonProps(el)}
                    width={el.w}
                    height={el.h}
                    cornerRadius={el.cornerRadius ?? 4}
                    shadowColor="rgba(0,0,0,0.3)"
                    shadowBlur={10}
                    shadowOpacity={0.5}
                    shadowOffsetY={4}
                  />
                );
              }
              if (el.type === 'circle') {
                return (
                  <Circle
                    key={el.id}
                    {...commonProps(el)}
                    radius={el.w / 2}
                    scaleX={el.w / el.h}
                    shadowColor="rgba(0,0,0,0.3)"
                    shadowBlur={10}
                    shadowOpacity={0.5}
                    shadowOffsetY={4}
                  />
                );
              }
              if (el.type === 'star') {
                return (
                  <Star
                    key={el.id}
                    {...commonProps(el)}
                    numPoints={5}
                    innerRadius={el.w / 4}
                    outerRadius={el.w / 2}
                    scaleX={el.w / el.h}
                    shadowColor="rgba(0,0,0,0.3)"
                    shadowBlur={10}
                    shadowOpacity={0.5}
                    shadowOffsetY={4}
                  />
                );
              }
              if (el.type === 'triangle') {
                return (
                  <RegularPolygon
                    key={el.id}
                    {...commonProps(el)}
                    sides={3}
                    radius={el.w / 2}
                    scaleX={el.w / el.h}
                    shadowColor="rgba(0,0,0,0.3)"
                    shadowBlur={10}
                    shadowOpacity={0.5}
                    shadowOffsetY={4}
                  />
                );
              }
              if (el.type === 'text') {
                return (
                  <Text
                    key={el.id}
                    {...commonProps(el)}
                    text={el.text || 'Text'}
                    fontSize={el.fontSize || el.h || 24}
                    fontFamily={el.fontFamily || 'Arial'}
                    fontStyle={el.fontStyle || 'normal'}
                    align={el.align || 'left'}
                    width={el.w}
                  />
                );
              }
              if (el.type === 'image') {
                return <KonvaImageItem key={el.id} el={el} commonProps={commonProps(el)} />;
              }
              return null;
            })}

            {/* Selection Drag Box */}
            {selectionBox && (
              <Rect
                x={selectionBox.x}
                y={selectionBox.y}
                width={selectionBox.width}
                height={selectionBox.height}
                fill="rgba(99, 102, 241, 0.2)"
                stroke="#6366f1"
                strokeWidth={1}
                dash={[4, 4]}
              />
            )}

            <Transformer 
              ref={trRef} 
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
        </div>
        </div>
      </div>
    </div>
  );
});

export default CanvasArea;
