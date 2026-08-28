"use client";

import { useEffect, useRef } from "react";
import { Realtime } from "ably";

export interface UpdateItem {
  channel: string;
  status: string;
  count: number;
}

export interface StatsUpdateMessage {
  timestamp: string;
  updates: UpdateItem[];
}

interface RealTimeStatsProps {
  onUpdate: (updates: UpdateItem[]) => void;
}

export default function RealTimeStats({ onUpdate }: RealTimeStatsProps) {
  const clientRef = useRef<Realtime | null>(null);
  const channelRef = useRef<{ unsubscribe: () => void; detach: () => void } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initAbly() {
      try {
        const response = await fetch("/api/ably/admin-auth");
        if (!response.ok) {
          throw new Error("Gagal fetch token Ably");
        }

        const { token } = (await response.json()) as { token: string };

        if (!mounted) return;

        const client = new Realtime({ token });
        clientRef.current = client;

        const channel = client.channels.get("admin:stats");
        channel.subscribe("stats-update", (message) => {
          const data = message.data as StatsUpdateMessage;
          if (data?.updates && Array.isArray(data.updates)) {
            onUpdate(data.updates);
          }
        });

        channelRef.current = {
          unsubscribe: () => channel.unsubscribe(),
          detach: () => channel.detach(),
        };
      } catch (error) {
        console.error("[RealTimeStats] Gagal inisialisasi Ably:", error);
      }
    }

    initAbly();

    return () => {
      mounted = false;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current.detach();
      }
      if (clientRef.current) {
        clientRef.current.close();
      }
    };
  }, [onUpdate]);

  return null;
}
