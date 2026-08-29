"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent, BubbleGroup } from "@/components/ui/bubble";
import { User } from "lucide-react";

interface ChatWindowProps {
  roomId: string;
  currentUserId: string;
  otherPartyName?: string;
}

export default function ChatWindow({
  roomId,
  currentUserId,
  otherPartyName = "Lawan Bicara",
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    connectionStatus,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  } = useChat({
    roomId,
    currentUserId,
  });

  useEffect(() => {
    markAsRead();
  }, [markAsRead, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (input.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [input, startTyping, stopTyping]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const content = input;
    setInput("");
    stopTyping();

    await sendMessage(content);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatMessageTime = (date: Date) => {
    return format(date, "HH:mm", { locale: id });
  };

  const isOwnMessage = (message: ChatMessage) => {
    return message.senderId === currentUserId;
  };

  return (
    <div className="flex h-full flex-col rounded-xl border bg-white">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherPartyName}</h3>
            <p className="text-xs text-muted-foreground">
              {connectionStatus === "connected" ? "Online" : "Menghubungkan..."}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {connectionStatus === "initialized" && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {messages.length === 0 && connectionStatus === "connected" && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">
              Mulai percakapan dengan mengirim pesan...
            </p>
          </div>
        )}

        <BubbleGroup>
          {messages.map((message) => {
            const own = isOwnMessage(message);
            return (
              <Bubble
                key={message.id}
                variant="secondary"
                align={own ? "end" : "start"}
              >
                <BubbleContent>
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p className="mt-1 text-xs opacity-70">
                    {formatMessageTime(message.createdAt)}
                  </p>
                </BubbleContent>
              </Bubble>
            );
          })}
        </BubbleGroup>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="mt-2">
            <Bubble variant="muted" align="start">
              <BubbleContent>
                <p className="text-xs text-muted-foreground italic">
                  {otherPartyName} sedang mengetik...
                </p>
              </BubbleContent>
            </Bubble>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim()}
            size="icon"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
