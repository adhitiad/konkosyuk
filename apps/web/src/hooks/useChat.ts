import { useState, useCallback, useEffect, useRef } from "react";
import { Realtime, RealtimeChannel, PresenceMessage } from "ably";
import { sendMessageAction } from "@/actions/chat";
import { captureException } from "@/lib/sentry";
import type {
  ChatMessage,
  ChatRoom,
  TypingUser,
  UseChatOptions,
  UseChatReturn,
} from "@/types/ui";

export type { ChatMessage, ChatRoom, TypingUser, UseChatOptions, UseChatReturn };

export function useChat({
  roomId,
  currentUserId,
  onMessageReceived,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("initialized");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientRef = useRef<Realtime | null>(null);

  useEffect(() => {
    if (!roomId) return;

    let mounted = true;

    const initChat = async () => {
      if (!roomId) return;
      const channelName = `chat:${roomId}`;

      try {
        let token: string | null = null;
        try {
          const res = await fetch("/api/auth/ably-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channelName }),
          });
          if (res.ok) {
            const json = await res.json();
            token = json.token;
          }
        } catch {
          captureException(new Error("[useChat] Failed to fetch Ably token"), {
            context: "Falling back to settings key",
          });
        }

        let client;
        if (token) {
          client = new Realtime({ token });
        } else {
          const res = await fetch("/api/auth/ably-config");
          if (!res.ok) throw new Error("Failed to load Ably config");
          const { key } = await res.json();
          client = new Realtime(key);
        }

        clientRef.current = client;

        const channel = client.channels.get(channelName) as RealtimeChannel;
        channelRef.current = channel;

        channel.subscribe((message) => {
          if (!mounted) return;
          const msg = message.data as ChatMessage;
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === msg.id);
            if (exists) return prev;
            const updated = [...prev, msg];
            onMessageReceived?.(msg);
            return updated;
          });
        });

        channel.presence.subscribe((presenceMessage: PresenceMessage) => {
          if (!mounted) return;
          const data = presenceMessage.data as TypingUser;
          if (presenceMessage.action === "enter") {
            setTypingUsers((prev) => {
              const filtered = prev.filter((u) => u.clientId !== data.clientId);
              return [...filtered, data];
            });
          } else if (
            presenceMessage.action === "leave" ||
            presenceMessage.action === "update"
          ) {
            setTypingUsers((prev) =>
              prev.filter((u) => u.clientId !== data.clientId),
            );
          }
        });

        setConnectionStatus("connected");
      } catch (error) {
        captureException(error as Error, {
          context: "[useChat] Error initializing",
        });
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
        const formData = new FormData();
        formData.append("roomId", roomId);
        formData.append("content", content.trim());

        const result = await sendMessageAction(undefined, formData);

        if (result.success && result.data) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === result.data?.id);
            if (exists) return prev;
            return [...prev, result.data as ChatMessage];
          });
        } else {
          captureException(
            new Error(result.error || "[useChat] Error sending message"),
            {
              context: "sendMessage",
            },
          );
        }
      } catch (error) {
        captureException(error as Error, {
          context: "[useChat] Error sending message",
        });
      }
    },
    [roomId],
  );

  const startTyping = useCallback(() => {
    if (!channelRef.current) return;
    setIsTyping(true);
    channelRef.current.presence.enter({
      clientId: currentUserId,
      timestamp: Date.now(),
    });

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
      captureException(error as Error, {
        context: "[useChat] Error marking as read",
      });
    }
  }, [roomId]);

  const sendMessageWithAttachment = useCallback(async () => {
    // Attachment upload belum diimplementasikan untuk chat ini.
  }, []);

  return {
    messages,
    connectionStatus,
    isTyping,
    typingUsers: typingUsers.filter((u) => u.clientId !== currentUserId),
    sendMessage,
    sendMessageWithAttachment,
    startTyping,
    stopTyping,
    markAsRead,
  };
}
