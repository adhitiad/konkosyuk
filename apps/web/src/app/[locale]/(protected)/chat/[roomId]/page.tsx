"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { apiClient } from "@/lib/axios";
import ChatWindow from "@/components/chat/ChatWindow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const roomId = params.roomId as string;

  const [isParticipant, setIsParticipant] = useState<boolean | null>(null);

  useEffect(() => {
    if (!roomId || !session?.user?.id) return;

    const checkRoom = async () => {
      try {
        const { data } = await apiClient.get(`/api/chat/rooms/${roomId}`);
        const room = data?.data?.room ?? data?.data;
        if (!room) {
          setIsParticipant(false);
          return;
        }
        const participant =
          room.tenantId === session.user.id || room.ownerId === session.user.id;
        setIsParticipant(participant);
      } catch {
        setIsParticipant(false);
      }
    };

    checkRoom();
  }, [roomId, session?.user?.id]);

  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">
          Silakan login untuk mengakses chat.
        </p>
      </div>
    );
  }

  if (isParticipant === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (isParticipant === false) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/chat")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Chat</h1>
        </div>
        <p className="text-muted-foreground">
          Anda tidak memiliki akses ke percakapan ini.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/chat")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Chat</h1>
        </div>
      </div>
      <div className="border rounded-xl bg-white">
        <ChatWindow roomId={roomId} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
