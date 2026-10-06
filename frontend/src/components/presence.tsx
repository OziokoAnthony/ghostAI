"use client";

// Live cursors/presence via Liveblocks (renders plain children when unconfigured).

import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import React, { useEffect, useState } from "react";

type Presence = {
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
};

type Storage = Record<string, never>;

const PUBLIC_KEY = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;

let RoomProvider: React.ComponentType<{
  id: string;
  initialPresence: Presence;
  children: React.ReactNode;
}> | null = null;
let useOthersPresence: (() => { connectionId: number; presence: Presence }[]) | null =
  null;
let useMyPresenceHook:
  | (() => [Presence, (p: Partial<Presence>) => void])
  | null = null;

if (PUBLIC_KEY) {
  const client = createClient({ publicApiKey: PUBLIC_KEY });
  const ctx = createRoomContext<Presence, Storage>(client);
  RoomProvider = ctx.RoomProvider as unknown as typeof RoomProvider;
  useOthersPresence = ctx.useOthers as unknown as typeof useOthersPresence;
  useMyPresenceHook = ctx.useMyPresence as unknown as typeof useMyPresenceHook;
}

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c"];

/** Wraps children in a Liveblocks room when configured; renders plain children otherwise. */
export default function PresenceLayer({
  roomId,
  name,
  children,
}: {
  roomId: string;
  name: string;
  children: React.ReactNode;
}) {
  if (!RoomProvider || !useOthersPresence || !useMyPresenceHook) {
    return <>{children}</>;
  }

  const initialPresence: Presence = {
    name,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    cursor: null,
  };

  return (
    <RoomProvider id={roomId} initialPresence={initialPresence}>
      <Inner>{children}</Inner>
    </RoomProvider>
  );
}

function Inner({ children }: { children: React.ReactNode }) {
  const others = useOthersPresence!();
  const [, updateMyPresence] = useMyPresenceHook!();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    updateMyPresence({ cursor: pos });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  return (
    <div
      className="relative"
      onPointerMove={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onPointerLeave={() => setPos(null)}
    >
      {/* Other collaborators' cursors */}
      {others.map(
        (o) =>
          o.presence.cursor && (
            <div
              key={o.connectionId}
              className="pointer-events-none absolute z-50"
              style={{
                left: o.presence.cursor.x,
                top: o.presence.cursor.y,
              }}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: o.presence.color }}
              />
              <span
                className="ml-2 rounded px-1 text-[10px] text-white"
                style={{ backgroundColor: o.presence.color }}
              >
                {o.presence.name}
              </span>
            </div>
          )
      )}
      {/* Presence list */}
      <div className="absolute right-2 top-2 z-40 flex gap-1">
        {others.map((o) => (
          <span
            key={o.connectionId}
            className="rounded-full px-2 py-0.5 text-[10px] text-white"
            style={{ backgroundColor: o.presence.color }}
          >
            {o.presence.name}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}
