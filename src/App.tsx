import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Workspace from "./components/Workspace";
import Homepage from "./components/Homepage";
import { CanvasElement, TimelineEvent } from "./types";
import { v4 as uuidv4 } from "uuid";

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem("magic_studio_theme") as 'dark' | 'light') || "dark";
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem("magic_studio_theme", next);
      return next;
    });
  };

  const [activeRoom, setActiveRoom] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("room");
  });

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const isBroadcastingRef = useRef<boolean>(false);

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
    const cleanRoom = roomId.replace(/^#/, "");
    const newUrl = `${window.location.pathname}?room=${cleanRoom}`;
    window.history.pushState({ room: cleanRoom }, "", newUrl);
    setActiveRoom(cleanRoom);
  };

  const handleGoHome = () => {
    window.history.pushState({}, "", window.location.pathname);
    setActiveRoom(null);
  };

  // BroadcastChannel Multi-window Real-Time Co-Design Sync
  useEffect(() => {
    if (!activeRoom) return;

    const channelName = `magic_studio_${activeRoom}`;
    const channel = new BroadcastChannel(channelName);

    channel.onmessage = (event) => {
      if (event.data && event.data.type === "ELEMENTS_UPDATE") {
        isBroadcastingRef.current = true;
        setElements(event.data.elements);
      } else if (event.data && event.data.type === "TIMELINE_UPDATE") {
        setTimeline(event.data.timeline);
      }
    };

    return () => {
      channel.close();
    };
  }, [activeRoom]);

  // Broadcast local element changes to other tabs in the same room
  const handleSetElements = (newElements: CanvasElement[]) => {
    setElements(newElements);
    if (activeRoom) {
      try {
        const channel = new BroadcastChannel(`magic_studio_${activeRoom}`);
        channel.postMessage({ type: "ELEMENTS_UPDATE", elements: newElements });
        channel.close();
      } catch (err) {
        console.error("Broadcast error:", err);
      }
    }
  };

  useEffect(() => {
    if (activeRoom) {
      // Initialize room timeline
      setTimeline([
        {
          id: uuidv4(),
          version: "v1.0",
          description: `Initialized account #${activeRoom} on Solana Devnet L1`,
          timestamp: new Date().toISOString(),
          type: "creation"
        }
      ]);
    }
  }, [activeRoom]);

  const handleSaveSnapshot = () => {
    const nextVersion = (1.0 + (timeline.length * 0.1)).toFixed(1);
    const newTimeline: TimelineEvent[] = [
      {
        id: uuidv4(),
        version: `v${nextVersion}`,
        description: "MagicBlock ER Snapshot Saved to L1",
        timestamp: new Date().toISOString(),
        type: "commit"
      },
      ...timeline
    ];
    setTimeline(newTimeline);

    if (activeRoom) {
      const channel = new BroadcastChannel(`magic_studio_${activeRoom}`);
      channel.postMessage({ type: "TIMELINE_UPDATE", timeline: newTimeline });
      channel.close();
    }
  };

  const handlePublish = () => {
    const newTimeline: TimelineEvent[] = [
      {
        id: uuidv4(),
        version: `FINAL`,
        description: "Published & Undelegated on Solana L1",
        timestamp: new Date().toISOString(),
        type: "commit"
      },
      ...timeline
    ];
    setTimeline(newTimeline);

    if (activeRoom) {
      const channel = new BroadcastChannel(`magic_studio_${activeRoom}`);
      channel.postMessage({ type: "TIMELINE_UPDATE", timeline: newTimeline });
      channel.close();
    }
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!activeRoom) {
    return <Homepage onLaunchStudio={handleLaunchStudio} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden ${theme === 'dark' ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-900'}`}>
      <Header 
        roomId={activeRoom}
        onGoHome={handleGoHome}
        onSaveSnapshot={handleSaveSnapshot}
        onPublish={handlePublish}
        onToggleMobileTools={() => setIsMobileSidebarOpen(prev => !prev)}
        theme={theme}
        onToggleTheme={toggleTheme}
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
        />
      </div>
    </div>
  );
}

