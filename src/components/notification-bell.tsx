"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  markAllNotificationsReadAction,
  updateNotificationAction,
} from "@/actions/notifications";
import { apiClient } from "@/lib/axios";

type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mounted] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { data, refetch } = useQuery<{ data: { data: Notification[] } }>({
    queryKey: ["notifications"],
    enabled: Boolean(session),
    queryFn: async () => (await apiClient.get("/api/notifications")).data,
  });
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const formData = new FormData();
      formData.append("notificationId", notificationId);
      const result = await updateNotificationAction(undefined, formData);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const notifications = data?.data?.data ?? [];
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  useEffect(() => {
    if (!session?.user?.id) return;
    const source = new EventSource("/api/notifications/stream");
    eventSourceRef.current = source;
    const handleNotification = (event: MessageEvent<string>) => {
      try {
        const notification = JSON.parse(event.data) as Notification;
        queryClient.setQueryData(
          ["notifications"],
          (old: { data?: { data?: Notification[] } } | undefined) => ({
            data: { data: [notification, ...(old?.data?.data ?? [])] },
          }),
        );
      } catch {
        /* Ignore malformed events. */
      }
    };
    source.addEventListener("notification", handleNotification);
    return () => {
      source.removeEventListener("notification", handleNotification);
      source.close();
      eventSourceRef.current = null;
    };
  }, [session?.user?.id, queryClient]);

  if (!mounted || !session) return null;
  const role = (session.user as { role?: string }).role;
  const openNotification = (notification: Notification) => {
    if (!notification.isRead) markAsReadMutation.mutate(notification.id);
    if (notification.type === "report" && notification.referenceId)
      router.push(
        role === "admin"
          ? `/admin/maintenance-reports?reportId=${notification.referenceId}`
          : "/owner/reports",
      );
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) refetch();
      }}
    >
      <Button
        render={<DropdownMenuTrigger />}
        variant="ghost"
        size="icon-sm"
        className="relative"
        aria-label="Notifikasi"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <p className="text-sm font-medium">Notifikasi</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const result = await markAllNotificationsReadAction();
              if (result.success) {
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
              }
            }}
          >
            Tandai semua dibaca
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Belum ada notifikasi
            </p>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={!notification.isRead ? "bg-muted/50" : ""}
                onSelect={() => openNotification(notification)}
              >
                <div className="w-full">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleDateString(
                      "id-ID",
                    )}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
