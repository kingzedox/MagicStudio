import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Workspace from "./components/Workspace";
import Homepage from "./components/Homepage";
import Toast from "./components/Toast";
import { CanvasElement, TimelineEvent } from "./types";
import { v4 as uuidv4 } from "uuid";
import { CanvasAreaHandle } from "./components/CanvasArea";
import { useMagicStudio } from "./hooks/useMagicStudio";
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from "./hooks/useToast";
import { getStorageKey, THEME_STORAGE_KEY } from "./constants";

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(THEME_STORAGE_KEY) as 'dark' | 'light') || "dark";
  });
  
  const { toasts, hideToast, success, error, loading } = useToast();

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  };

  const [activeRoom, setActiveRoom] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("room");
  });
  const [onChainStatus, setOnChainStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const canvasRef = useRef<CanvasAreaHandle>(null);
  const hasLoadedRef = useRef<boolean>(false);

  // MagicStudio hook
  const { 
    initializeCanvas, 
    delegateToER, 
    fetchCanvasState, 
    saveSnapshot, 
    publishAndUndelegate,
    updateElement,
    checkIfDelegated
  } = useMagicStudio(activeRoom);

  // Sync activeRoom with URL query param
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveRoom(params.get("room"));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLaunchStudio = (roomId: string) => {
    // If the user pastes a full URL, extract the room parameter
    let cleanRoom = roomId.replace(/^#/, "");
    try {
      if (cleanRoom.includes("http")) {
        const url = new URL(cleanRoom);
        const urlRoom = url.searchParams.get("room");
        if (urlRoom) cleanRoom = urlRoom;
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
    
    // Ensure it doesn't exceed 32 chars (program limit)
    cleanRoom = cleanRoom.substring(0, 32);

    const newUrl = `${window.location.pathname}?room=${cleanRoom}`;
    window.history.pushState({ room: cleanRoom }, "", newUrl);
    setActiveRoom(cleanRoom);
    setOnChainStatus('connecting');
  };

  const handleGoHome = () => {
    window.history.pushState({}, "", window.location.pathname);
    setActiveRoom(null);
  };

  // Initialize Solana on-chain account when joining a room
  const { publicKey } = useWallet();
  
  const setupCanvas = async () => {
    if (!activeRoom || !publicKey) return;
    try {
      const isDelegated = await checkIfDelegated();
      
      if (isDelegated) {
        success("Connected to existing canvas!");
        setOnChainStatus('connected');
        return;
      }
      
      const initToastId = loading("Setting up on-chain workspace...");
      await initializeCanvas();
      hideToast(initToastId);
      
      const delegateToastId = loading("Delegating workspace to Ephemeral Rollup...");
      await delegateToER();
      hideToast(delegateToastId);
      
      success("Workspace setup complete!");
      setOnChainStatus('connected');
    } catch (err: any) {
      if (err?.message?.includes("already in use") || err?.logs?.some((log: string) => log.includes("already in use"))) {
        try {
          const delegateToastId = loading("Canvas exists on L1. Delegating to Ephemeral Rollup...");
          await delegateToER();
          hideToast(delegateToastId);
          success("Connected to existing canvas!");
          setOnChainStatus('connected');
        } catch (delegateErr: any) {
          error(`Failed to connect: ${delegateErr?.message || "Unknown error"}`);
          setOnChainStatus('failed');
        }
      } else {
        error(`Blockchain setup failed: ${err?.message || "Unknown error"}`);
        setOnChainStatus('failed');
      }
    }
  };

  useEffect(() => {
    setupCanvas();
  }, [activeRoom, publicKey]);

  // Read-only synchronization for guests (and local user)
  useEffect(() => {
    if (!activeRoom) return;
    
    let isActive = true;
    const loadState = async () => {
      // Wait slightly to ensure ER program initializes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let state = await fetchCanvasState();
      if (!state) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        state = await fetchCanvasState();
      }
      
      if (isActive && state && state.elements) {
        const mapped = state.elements
          .filter((el: any) => el.id > 0)
          .map((el: any) => ({
            id: String(el.id),
            type: el.elementType === 0 ? "rect" : el.elementType === 1 ? "circle" : "text",
            x: el.x,
            y: el.y,
            w: el.w,
            h: el.h,
            color: `rgb(${el.colorRgb[0]}, ${el.colorRgb[1]}, ${el.colorRgb[2]})`
          }));
        setElements(mapped);
      }
    };
    
    loadState();
    return () => { isActive = false; };
  }, [activeRoom, fetchCanvasState]);

  // Load from localStorage on room join
  useEffect(() => {
    if (!activeRoom) return;
    
    hasLoadedRef.current = false;
    
    const savedElements = localStorage.getItem(getStorageKey(activeRoom, 'elements'));
    const savedTimeline = localStorage.getItem(getStorageKey(activeRoom, 'timeline'));
    
    if (savedElements) {
      try {
        setElements(JSON.parse(savedElements));
      } catch (err) {
        error("Failed to load saved elements");
        setElements([]);
      }
    } else {
      setElements([]);
    }
    
    if (savedTimeline) {
      try {
        setTimeline(JSON.parse(savedTimeline));
      } catch (err) {
        error("Failed to load timeline");
        setTimeline([{
          id: uuidv4(),
          version: "v1.0",
          description: `Initialized account #${activeRoom} on Solana Devnet L1`,
          timestamp: new Date().toISOString(),
          type: "creation"
        }]);
      }
    } else {
      setTimeline([{
        id: uuidv4(),
        version: "v1.0",
        description: `Initialized account #${activeRoom} on Solana Devnet L1`,
        timestamp: new Date().toISOString(),
        type: "creation"
      }]);
    }
    
    hasLoadedRef.current = true;
  }, [activeRoom]);

  // Handle real-time collaboration events from Ephemeral Rollup
  useEffect(() => {
    if (!activeRoom) return;

    const handleElementUpdated = (e: any) => {
      console.log("Received ElementUpdated event:", e.detail);
      const { elementId, elementType, x, y, w, h, colorRgb, editor } = e.detail;
      // Don't update if we are the editor (local optimistic update already happened)
      if (publicKey && editor.toString() === publicKey.toString()) {
        console.log("Ignoring event from ourselves (Phantom wallet match)");
        return;
      }

      setElements(prev => {
        const existing = prev.find(el => el.id === String(elementId));
        if (existing) {
          return prev.map(el => el.id === String(elementId) ? {
            ...el,
            x, y, w, h,
            color: `rgb(${colorRgb[0]}, ${colorRgb[1]}, ${colorRgb[2]})`
          } : el);
        } else {
          return [...prev, {
            id: String(elementId),
            type: elementType === 0 ? "rect" : elementType === 1 ? "circle" : "text",
            x, y, w, h,
            color: `rgb(${colorRgb[0]}, ${colorRgb[1]}, ${colorRgb[2]})`
          }];
        }
      });
    };

    const handleElementRemoved = (e: any) => {
      const { elementId, editor } = e.detail;
      if (publicKey && editor.toString() === publicKey.toString()) return;
      
      setElements(prev => prev.filter(el => el.id !== String(elementId)));
    };

    const handleBatchUpdated = async (e: any) => {
      const { editor } = e.detail;
      if (publicKey && editor.toString() === publicKey.toString()) return;
      
      // For batch updates, it's safer to just fetch the entire state
      const state = await fetchCanvasState();
      if (state && state.elements) {
        const mapped = state.elements
          .filter((el: any) => el.id > 0)
          .map((el: any) => ({
            id: String(el.id),
            type: el.elementType === 0 ? "rect" : el.elementType === 1 ? "circle" : "text",
            x: el.x,
            y: el.y,
            w: el.w,
            h: el.h,
            color: `rgb(${el.colorRgb[0]}, ${el.colorRgb[1]}, ${el.colorRgb[2]})`
          }));
        setElements(mapped);
      }
    };

    window.addEventListener('magicstudio:ElementUpdated', handleElementUpdated);
    window.addEventListener('magicstudio:ElementRemoved', handleElementRemoved);
    window.addEventListener('magicstudio:BatchUpdated', handleBatchUpdated);

    return () => {
      window.removeEventListener('magicstudio:ElementUpdated', handleElementUpdated);
      window.removeEventListener('magicstudio:ElementRemoved', handleElementRemoved);
      window.removeEventListener('magicstudio:BatchUpdated', handleBatchUpdated);
    };
  }, [activeRoom, publicKey, fetchCanvasState]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (activeRoom && hasLoadedRef.current) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(getStorageKey(activeRoom, 'elements'), JSON.stringify(elements));
          localStorage.setItem(getStorageKey(activeRoom, 'timeline'), JSON.stringify(timeline));
        } catch (err) {
          console.error("Failed to save to localStorage:", err);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [elements, timeline, activeRoom]);

  // Local state update (CanvasArea handles on-chain updateElement)
  const handleSetElements = (newElements: CanvasElement[]) => {
    setElements(newElements);
  };
  
  const handleUpdateElement = (el: CanvasElement) => {
    // Only send if we have an ID and it's a number
    if (el && !isNaN(Number(el.id)) && Number(el.id) > 0) {
      updateElement(
        Number(el.id) - 1, // IDs are 1-indexed in UI, 0-indexed in program
        el.type === 'rect' ? 0 : el.type === 'circle' ? 1 : 2,
        Math.round(el.x),
        Math.round(el.y),
        Math.round(el.w || 0),
        Math.round(el.h || 0),
        [255, 255, 255] // Default color for now, since parse logic is omitted
      ).catch(err => {
        console.error("Failed to update element on ER:", err);
      });
    }
  };

  // Timeline initialization moved to load effect

  const handleSaveSnapshot = async () => {
    const loadingToastId = loading("Saving snapshot to L1...");
    
    try {
      await saveSnapshot();
      hideToast(loadingToastId);
      success("Snapshot saved to Solana L1!");
      
      const nextVersion = (1.0 + (timeline.length * 0.1)).toFixed(1);
      setTimeline([
        {
          id: uuidv4(),
          version: `v${nextVersion}`,
          description: "MagicBlock ER Snapshot Saved to L1",
          timestamp: new Date().toISOString(),
          type: "commit"
        },
        ...timeline
      ]);
    } catch (e: any) {
      hideToast(loadingToastId);
      error(`Failed to save snapshot: ${e?.message || "Unknown error"}`);
    }
  };

  const handlePublish = async () => {
    const loadingToastId = loading("Publishing to L1 and undelegating...");
    
    try {
      const txId = await publishAndUndelegate();
      const url = `https://explorer.solana.com/tx/${txId}?cluster=devnet`;
      alert(`Successfully published to Solana L1!\n\nView on Explorer: ${url}`);
      hideToast(loadingToastId);
      success("Successfully published and undelegated!");
      
      setTimeline([
        {
          id: uuidv4(),
          version: `FINAL`,
          description: "Published & Undelegated on Solana L1",
          timestamp: new Date().toISOString(),
          type: "commit"
        },
        ...timeline
      ]);
    } catch (e: any) {
      hideToast(loadingToastId);
      error(`Failed to publish: ${e?.message || "Unknown error"}`);
    }
  };

  // Export functions
  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    
    const stage = canvasRef.current.getStage();
    if (!stage) {
      error("Canvas not ready for export");
      return;
    }
    
    try {
      const dataURL = stage.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `magic-studio-${activeRoom}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success("Canvas exported as PNG!");
    } catch (err: any) {
      error(`Export failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify({ elements, timeline }, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `magic-studio-${activeRoom}.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success("Project exported successfully!");
    } catch (err: any) {
      error(`Export failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.elements && Array.isArray(data.elements)) {
          setElements(data.elements);
          success("Elements imported successfully!");
        }
        if (data.timeline && Array.isArray(data.timeline)) {
          setTimeline(data.timeline);
        }
      } catch (err) {
        error("Invalid project file. Please check the JSON format.");
      }
    };
    reader.readAsText(file);
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Show homepage if no active room
  if (!activeRoom) {
    return <Homepage onLaunchStudio={handleLaunchStudio} theme={theme} onToggleTheme={toggleTheme} />;
  }

  // Show workspace - wallet connection optional, just warn if not connected
  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden ${theme === 'dark' ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-900'}`}>
      {/* Wallet Warning Banner */}
      {!publicKey && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 text-sm text-yellow-200 flex items-center justify-center gap-2">
          <span>⚠️ Connect your wallet to save to Solana blockchain</span>
        </div>
      )}
      
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}
      
      {onChainStatus === 'failed' && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-sm text-center font-medium flex justify-center items-center gap-2 z-50 shadow-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Blockchain connection failed (Insufficient Devnet SOL or network error). You are in offline mode. Drawings will not be saved on-chain.
        </div>
      )}
      
      <Header 
        roomId={activeRoom}
        onGoHome={handleGoHome}
        onSaveSnapshot={handleSaveSnapshot}
        onPublish={handlePublish}
        onToggleMobileTools={() => setIsMobileSidebarOpen(prev => !prev)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Workspace 
          id={activeRoom} 
          elements={elements} 
          setElements={handleSetElements}
          timeline={timeline}
          setTimeline={setTimeline}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
          theme={theme}
          canvasRef={canvasRef}
          onUpdateElement={handleUpdateElement}
        />
      </div>
    </div>
  );
}
