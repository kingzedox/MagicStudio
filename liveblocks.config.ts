import { LiveList } from "@liveblocks/client";
import type { CanvasElement } from "@/types";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      selection: string[];
    };
    Storage: {
      elements: LiveList<any>;
      canvasBg: string;
    };
    UserMeta: {
      id: string;
      info: {
        name: string;
        color: string;
      };
    };
    RoomEvent: {};
  }
}

export {};
