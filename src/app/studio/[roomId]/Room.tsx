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
  // Try to use env var, fallback to empty to avoid build errors, but it won't connect without a valid key
  const apiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "pk_placeholder";

  return (
    <LiveblocksProvider publicApiKey={apiKey}>
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
