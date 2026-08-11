import { useState, useEffect, useRef } from "react";
import { CanvasElement, TimelineEvent } from "../types";
import CanvasArea, { CanvasAreaHandle } from "./CanvasArea";
import Sidebar from "./Sidebar";
import PromptBar from "./PromptBar";
import { v4 as uuidv4 } from "uuid";

interface WorkspaceProps {
  id: string;
  elements: CanvasElement[];
  setElements: (els: CanvasElement[]) => void;
  timeline: TimelineEvent[];
  setTimeline: (t: TimelineEvent[]) => void;
  isMobileSidebarOpen?: boolean;
  onCloseMobileSidebar?: () => void;
  theme?: 'dark' | 'light';
  onUpdateElement?: (element: CanvasElement) => void;
  canvasRef?: React.RefObject<CanvasAreaHandle | null>;
}

export default function Workspace({ 
  id, 
  elements, 
  setElements, 
  timeline, 
  setTimeline,
  isMobileSidebarOpen = false,
  onCloseMobileSidebar,
  theme = 'dark',
  onUpdateElement,
  canvasRef
}: WorkspaceProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const copiedElementRef = useRef<CanvasElement | null>(null);

  const selectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const setSelectedId = (id: string | null) => {
    setSelectedIds(id ? [id] : []);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        const newElements = elements.filter(el => el.id !== selectedId);
        setElements(newElements);
        setSelectedId(null);
        handleAddCommit("Deleted element");
        return;
      }

      // Copy (Cmd/Ctrl + C)
      if (cmdOrCtrl && e.key === 'c' && selectedId) {
        e.preventDefault();
        const selectedEl = elements.find(el => el.id === selectedId);
        if (selectedEl) {
          copiedElementRef.current = { ...selectedEl };
        }
        return;
      }

      // Paste (Cmd/Ctrl + V)
      if (cmdOrCtrl && e.key === 'v' && copiedElementRef.current) {
        e.preventDefault();
        const newEl: CanvasElement = {
          ...copiedElementRef.current,
          id: uuidv4(),
          x: copiedElementRef.current.x + 20,
          y: copiedElementRef.current.y + 20,
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
        handleAddCommit("Pasted element");
        return;
      }

      // Duplicate (Cmd/Ctrl + D)
      if (cmdOrCtrl && e.key === 'd' && selectedId) {
        e.preventDefault();
        const selectedEl = elements.find(el => el.id === selectedId);
        if (selectedEl) {
          const newEl: CanvasElement = {
            ...selectedEl,
            id: uuidv4(),
            x: selectedEl.x + 20,
            y: selectedEl.y + 20,
          };
          setElements([...elements, newEl]);
          setSelectedId(newEl.id);
          handleAddCommit("Duplicated element");
        }
        return;
      }

      // Select All (Cmd/Ctrl + A)
      if (cmdOrCtrl && e.key === 'a') {
        e.preventDefault();
        const allIds = elements.filter(el => !el.locked).map(el => el.id);
        setSelectedIds(allIds);
        return;
      }

      // Lock/Unlock (Cmd/Ctrl + L)
      if (cmdOrCtrl && e.key === 'l' && selectedId) {
        e.preventDefault();
        const selectedEl = elements.find(el => el.id === selectedId);
        if (selectedEl) {
          const newElements = elements.map(el =>
            el.id === selectedId ? { ...el, locked: !el.locked } : el
          );
          setElements(newElements);
          handleAddCommit(selectedEl.locked ? "Unlocked element" : "Locked element");
        }
        return;
      }

      // Undo (Cmd/Ctrl + Z)
      if (cmdOrCtrl && e.key === 'z' && !e.shiftKey && canvasRef?.current) {
        e.preventDefault();
        canvasRef.current.undo();
        return;
      }

      // Redo (Cmd/Ctrl + Shift + Z)
      if (cmdOrCtrl && e.shiftKey && e.key === 'z' && canvasRef?.current) {
        e.preventDefault();
        canvasRef.current.redo();
        return;
      }

      // Arrow key nudging
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedId) {
        e.preventDefault();
        const selectedEl = elements.find(el => el.id === selectedId);
        if (selectedEl && !selectedEl.locked) {
          const nudgeAmount = e.shiftKey ? 10 : 1;
          let newX = selectedEl.x;
          let newY = selectedEl.y;

          if (e.key === 'ArrowLeft') newX -= nudgeAmount;
          if (e.key === 'ArrowRight') newX += nudgeAmount;
          if (e.key === 'ArrowUp') newY -= nudgeAmount;
          if (e.key === 'ArrowDown') newY += nudgeAmount;

          const newElements = elements.map(el =>
            el.id === selectedId ? { ...el, x: newX, y: newY } : el
          );
          setElements(newElements);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, selectedId, selectedIds, canvasRef]);

  const handleAddCommit = (description: string) => {
    if (!description || description.trim() === '') return;
    
    const nextVersion = timeline.length > 0 ? (1.0 + (timeline.length * 0.1)).toFixed(1) : "1.0";
    const newEvent: TimelineEvent = {
      id: uuidv4(),
      version: `v${nextVersion}`,
      description: description.trim(),
      timestamp: new Date().toISOString(),
      type: description.toLowerCase().includes("ai") ? "ai" : "commit"
    };
    setTimeline([newEvent, ...timeline]);
  };

  const handleAiGenerated = (newElements: CanvasElement[]) => {
    if (!newElements || !Array.isArray(newElements)) return;
    setElements(newElements);
  };

  return (
    <div className={`flex flex-1 overflow-hidden relative ${theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
      <CanvasArea 
        elements={elements}
        setElements={setElements}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        onAddCommit={handleAddCommit}
        theme={theme}
        onUpdateElement={onUpdateElement}
        ref={canvasRef}
      />
      <Sidebar 
        elements={elements}
        setElements={setElements}
        timeline={timeline}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        onAddCommit={handleAddCommit}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={onCloseMobileSidebar}
        theme={theme}
      />
      <PromptBar 
        currentElements={elements}
        onGenerated={handleAiGenerated}
        onAddCommit={handleAddCommit}
        theme={theme}
      />
    </div>
  );
}
