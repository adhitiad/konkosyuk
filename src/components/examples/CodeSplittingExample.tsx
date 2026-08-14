"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic import untuk komponen berat - SSR dimatikan untuk menghindari hydration issues
const MapWithRoute = dynamic(
  () => import("@/components/MapWithRoute"),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="w-full h-[500px] rounded-xl" />
    ),
  }
);

const ChatWindow = dynamic(
  () => import("@/components/chat/ChatWindow"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    ),
  }
);

const PropertyMapPicker = dynamic(
  () => import("@/components/property/map-picker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] animate-pulse rounded-lg border bg-muted" />
    ),
  }
);

// Contoh penggunaan
export default function CodeSplittingExample() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Peta Interaktif</h2>
        <MapWithRoute properties={[]} height="500px" />
      </div>

      <div>
        <h2 className="text-xl font-semibold">Chat Real-time</h2>
        <div className="h-[600px]">
          <ChatWindow roomId="room-1" currentUserId="user-1" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Map Picker</h2>
        <PropertyMapPicker
          lat={-6.200000}
          lng={106.816666}
          onLocationSelected={() => {}}
        />
      </div>
    </div>
  );
}