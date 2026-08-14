"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useChat, type Message } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

  const { messages, connectionStatus, isTyping, typingUsers, sendMessage, startTyping, stopTyping, markAsRead } =
    useChat({
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

  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm", { locale: id });
  };

  const isOwnMessage = (message: Message) => {
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

        {messages.map((message) => {
          const own = isOwnMessage(message);
          return (
            <div
              key={message.id}
              className={`flex ${own ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  own
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    own ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 px-4 py-2">
              <p className="text-xs text-muted-foreground italic">
                {otherPartyName} sedang mengetik...
              </p>
            </div>
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
