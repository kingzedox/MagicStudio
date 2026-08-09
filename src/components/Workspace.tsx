import { useState } from "react";
import { CanvasElement, TimelineEvent } from "../types";
import CanvasArea from "./CanvasArea";
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
}

export default function Workspace({ 
  id, 
  elements, 
  setElements, 
  timeline, 
  setTimeline,
  isMobileSidebarOpen = false,
  onCloseMobileSidebar,
  theme = 'dark'
}: WorkspaceProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const setSelectedId = (id: string | null) => {
    setSelectedIds(id ? [id] : []);
  };

  const handleAddCommit = (description: string) => {
    const nextVersion = timeline.length > 0 ? (1.0 + (timeline.length * 0.1)).toFixed(1) : "1.0";
    const newEvent: TimelineEvent = {
      id: uuidv4(),
      version: `v${nextVersion}`,
      description,
      timestamp: new Date().toISOString(),
      type: description.includes("AI") ? "ai" : "commit"
    };
    setTimeline([newEvent, ...timeline]);
  };

  const handleAiGenerated = (newElements: CanvasElement[]) => {
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
