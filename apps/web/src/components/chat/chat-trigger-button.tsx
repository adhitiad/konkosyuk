"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { apiClient } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface ChatTriggerButtonProps {
  propertyId: string;
  propertyName: string;
  tenantId?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
}

export function ChatTriggerButton({
  propertyId,
  propertyName,
  tenantId,
  variant = "outline",
  className,
}: ChatTriggerButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const handleChat = async () => {
    if (!session?.user?.id) {
      router.push(`/${locale}/login`);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await apiClient.post("/api/chat/rooms", {
        propertyId,
        tenantId:
          (session?.user as { role?: string }).role === "cust"
            ? session.user.id
            : tenantId,
      });

      const room = data?.data?.room ?? data?.room;
      if (room?.id) {
        router.push(`/${locale}/chat/${room.id}`);
      }
    } catch (error) {
      console.error("Failed to create chat room:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleChat}
      disabled={isLoading}
    >
      <MessageSquare className="size-4 mr-2" />
      {isLoading ? "Memuat..." : `Chat ${propertyName}`}
    </Button>
  );
}
