'use client';

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";
import { Loader2 } from "lucide-react";

export function Room({ children, roomId }: { children: ReactNode; roomId: string }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider 
        id={roomId}
        initialPresence={{
          cursor: null,
          selection: [],
        }}
        initialStorage={{
          elements: new LiveList([]),
          canvasBg: "#1a1a2e"
        }}
      >
        <ClientSideSuspense fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-[#0f0f0f] text-white">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF4564]" />
          </div>
        }>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
