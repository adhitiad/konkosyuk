"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { apiClient } from "@/lib/axios";
import ChatRoomList from "@/components/chat/ChatRoomList";
import ChatWindow from "@/components/chat/ChatWindow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  const { data: session } = useSession();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const { data, isLoading } = useQuery({
    queryKey: ["chat-rooms"],
    queryFn: async () => (await apiClient.get("/api/chat/rooms")).data,
    enabled: !!session?.user?.id,
    refetchInterval: 30000,
  });

  const rooms = Array.isArray(data?.data?.data) ? data.data.data : [];

  const handleRoomSelect = (room: { id: string }) => {
    setSelectedRoom(room.id);
    setMobileView("chat");
  };

  const handleBackToList = () => {
    setMobileView("list");
    setSelectedRoom(null);
  };

  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">
          Silakan login untuk mengakses chat.
        </p>
      </div>
    );
  }

  const userRole = (session.user as { role?: string }).role ?? "cust";
  const chatRole = userRole === "cust" ? "tenant" : userRole;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Pesan</h1>
        <p className="mt-2 text-muted-foreground">
          Kelola percakapan Anda dengan owner atau tenant
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        <div
          className={`w-full md:w-80 border rounded-xl bg-white ${
            mobileView === "chat" ? "hidden md:flex" : "flex"
          } md:flex flex-col`}
        >
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <ChatRoomList
              rooms={rooms}
              currentUserRole={chatRole as "owner" | "tenant"}
              selectedRoomId={selectedRoom ?? undefined}
              onRoomSelect={handleRoomSelect}
            />
          )}
        </div>

        <div
          className={`flex-1 border rounded-xl bg-white ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          } md:flex flex-col`}
        >
          {selectedRoom ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 p-4 border-b md:hidden">
                <Button variant="ghost" size="sm" onClick={handleBackToList}>
                  ← Kembali
                </Button>
              </div>
              <ChatWindow
                roomId={selectedRoom}
                currentUserId={session.user.id}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquare className="size-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Pilih percakapan</p>
              <p className="text-sm text-muted-foreground mt-2">
                Pilih salah satu percakapan dari daftar di sebelah kiri untuk
                mulai chat
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
