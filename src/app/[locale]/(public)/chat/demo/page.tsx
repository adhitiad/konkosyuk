"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatRoomList from "@/components/chat/ChatRoomList";
import ChatWindow from "@/components/chat/ChatWindow";
import { useChat, type ChatRoom, type Message } from "@/hooks/useChat";

const ChatRoomListDynamic = dynamic(
  () => import("@/components/chat/ChatRoomList"),
  { ssr: false, loading: () => <Skeleton className="h-full w-full md:w-80" /> },
);

const ChatWindowDynamic = dynamic(
  () => import("@/components/chat/ChatWindow"),
  { ssr: false, loading: () => <Skeleton className="h-full" /> },
);

export default function ChatDemoPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: "owner" | "tenant";
  } | null>(null);
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    const mockUser = {
      id: "demo-user-123",
      role: "owner" as const,
    };
    setCurrentUser(mockUser);

    const mockRooms: ChatRoom[] = [
      {
        id: "room-1",
        propertyId: "prop-1",
        tenantId: "tenant-1",
        ownerId: "demo-user-123",
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    setTimeout(() => {
      setRooms(mockRooms);
      setSelectedRoom(mockRooms[0]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="mt-2 h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
          <Skeleton className="h-full w-full md:col-span-1" />
          <Skeleton className="h-full w-full md:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Chat Real-time</h1>
        <p className="mt-2 text-muted-foreground">
          Percakapan real-time antara Owner dan Tenant menggunakan Ably.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">Chat Room</TabsTrigger>
          <TabsTrigger value="info">Informasi</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
            <ChatRoomListDynamic
              rooms={rooms}
              currentUserId={currentUser?.id || ""}
              currentUserRole={currentUser?.role || "owner"}
              selectedRoomId={selectedRoom?.id}
              onRoomSelect={setSelectedRoom}
            />
            <div className="md:col-span-2">
              {selectedRoom ? (
                <ChatWindowDynamic
                  roomId={selectedRoom.id}
                  currentUserId={currentUser?.id || ""}
                  otherPartyName={
                    currentUser?.role === "owner" ? "Tenant" : "Owner"
                  }
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border bg-gray-50">
                  <p className="text-sm text-muted-foreground">
                    Pilih percakapan untuk mulai chat
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <div className="rounded-xl border bg-white p-6 space-y-4">
            <h3 className="text-lg font-semibold">Setup Ably</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Daftar di https://ably.com/</li>
              <li>Buat App dan salin API Key</li>
              <li>Tambahkan ke .env.local:</li>
            </ol>
            <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
              {`ABLY_API_KEY=your_server_api_key
NEXT_PUBLIC_ABLY_KEY=your_client_api_key`}
            </pre>
            <p className="text-sm text-muted-foreground">
              REST API Key untuk server, Client API Key untuk frontend.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

