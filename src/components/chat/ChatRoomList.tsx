"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MessageSquare, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import type { ChatRoom } from "@/hooks/useChat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ChatRoomListProps {
  rooms: ChatRoom[];
  currentUserId: string;
  currentUserRole: "owner" | "tenant";
  selectedRoomId?: string;
  onRoomSelect?: (room: ChatRoom) => void;
  unreadCounts?: Record<string, number>;
}

export default function ChatRoomList({
  rooms,
  currentUserId,
  currentUserRole,
  selectedRoomId,
  onRoomSelect,
  unreadCounts = {},
}: ChatRoomListProps) {
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [rooms]);

  const getOtherParty = (room: ChatRoom) => {
    if (currentUserRole === "owner") {
      return { id: room.tenantId, name: "Tenant" };
    }
    return { id: room.ownerId, name: "Owner" };
  };

  const formatLastMessage = (room: ChatRoom) => {
    if (!room.lastMessageAt) return "Belum ada pesan";
    return formatDistanceToNow(new Date(room.lastMessageAt), {
      addSuffix: true,
      locale: id,
    });
  };

  return (
    <div className="flex h-full flex-col rounded-xl border bg-white">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Pesan</h2>
        <p className="text-xs text-muted-foreground">
          {rooms.length} percakapan aktif
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="mb-2 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Belum ada percakapan
            </p>
          </div>
        ) : (
          sortedRooms.map((room) => {
            const otherParty = getOtherParty(room);
            const isSelected = room.id === selectedRoomId;
            const unreadCount = unreadCounts[room.id] || 0;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onRoomSelect?.(room)}
                className={`flex w-full items-start gap-3 border-b p-4 text-left transition-colors hover:bg-gray-50 ${
                  isSelected ? "bg-primary/5" : ""
                }`}
              >
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="size-4" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {otherParty.name}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatLastMessage(room)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    Klik untuk melihat percakapan
                  </p>
                </div>

                {unreadCount > 0 && (
                  <Badge
                    variant="default"
                    className="size-5 rounded-full p-0 text-xs"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
