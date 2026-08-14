import { useState, useCallback, useEffect, useRef } from "react";
import { createAblyClient } from "@/lib/ably/client";

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface TypingUser {
  clientId: string;
  timestamp: number;
}

export interface UseChatOptions {
  roomId: string | null;
  currentUserId: string;
  onMessageReceived?: (message: Message) => void;
  onTypingChanged?: (typing: TypingUser[]) => void;
}

export interface UseChatReturn {
  messages: Message[];
  connectionStatus: string;
  isTyping: boolean;
  typingUsers: TypingUser[];
  sendMessage: (content: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  markAsRead: () => Promise<void>;
}

export function useChat({
  roomId,
  currentUserId,
  onMessageReceived,
  onTypingChanged,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("initialized");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId) return;

    let mounted = true;

    const initChat = async () => {
      try {
        const client = createAblyClient();
        clientRef.current = client;

        const channel = client.channels.get(`chat:${roomId}`);
        channelRef.current = channel;

        channel.subscribe((message: any) => {
          if (!mounted) return;
          const msg = message.data as Message;
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === msg.id);
            if (exists) return prev;
            const updated = [...prev, msg];
            onMessageReceived?.(msg);
            return updated;
          });
        });

        channel.presence.subscribe((presenceMessage: any) => {
          if (!mounted) return;
          const data = presenceMessage.data as TypingUser;
          if (presenceMessage.action === "enter") {
            setTypingUsers((prev) => {
              const filtered = prev.filter((u) => u.clientId !== data.clientId);
              return [...filtered, data];
            });
          } else if (presenceMessage.action === "leave" || presenceMessage.action === "update") {
            setTypingUsers((prev) =>
              prev.filter((u) => u.clientId !== data.clientId),
            );
          }
        });

        setConnectionStatus("connected");
      } catch (error) {
        console.error("[useChat] Error initializing:", error);
        setConnectionStatus("failed");
      }
    };

    initChat();

    return () => {
      mounted = false;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current.presence.unsubscribe();
        channelRef.current.detach();
      }
      if (clientRef.current) {
        clientRef.current.close();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId, onMessageReceived]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!roomId || !content.trim()) return;

      try {
        const response = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, content: content.trim() }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const message = await response.json();

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      } catch (error) {
        console.error("[useChat] Error sending message:", error);
      }
    },
    [roomId],
  );

  const startTyping = useCallback(() => {
    if (!channelRef.current) return;
    setIsTyping(true);
    channelRef.current.presence.enter(
      { clientId: currentUserId, timestamp: Date.now() },
      { clientId: currentUserId },
    );

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      channelRef.current?.presence.leave({ clientId: currentUserId });
    }, 2000);
  }, [currentUserId]);

  const stopTyping = useCallback(() => {
    if (!channelRef.current) return;
    setIsTyping(false);
    channelRef.current.presence.leave({ clientId: currentUserId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [currentUserId]);

  const markAsRead = useCallback(async () => {
    if (!roomId) return;

    try {
      await fetch(`/api/chat/rooms/${roomId}/read`, {
        method: "PUT",
      });
    } catch (error) {
      console.error("[useChat] Error marking as read:", error);
    }
  }, [roomId]);

  return {
    messages,
    connectionStatus,
    isTyping,
    typingUsers: typingUsers.filter((u) => u.clientId !== currentUserId),
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  };
}
