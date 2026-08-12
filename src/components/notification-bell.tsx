'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { apiClient } from '@/lib/axios'

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export default function NotificationBell() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: { data: Notification[]; meta: { total: number } } }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/notifications')
      return data
    },
    staleTime: 30000,
    enabled: !!session,
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(`/api/notifications/${id}/read`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch('/api/notifications/read-all')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const notifications: Notification[] = data?.data?.data ?? []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleRealtimeNotification = useCallback((notification: Notification) => {
    queryClient.setQueryData(['notifications'], (old: { success: boolean; data: { data: Notification[]; meta: { total: number } } } | undefined) => {
      const existing = old?.data?.data ?? []
      if (existing.some((n) => n.id === notification.id)) {
        return old
      }
      return {
        ...old,
        data: {
          ...old?.data,
          data: [notification, ...existing],
          meta: old?.data?.meta ?? { total: existing.length + 1 },
        },
      }
    })
    toast({
      title: notification.title,
      description: notification.message,
      type: 'info',
    })
  }, [queryClient])

  useEffect(() => {
    if (!session?.user?.id) return

    const eventSource = new EventSource('/api/notifications/stream')
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as Notification
        handleRealtimeNotification(notification)
      } catch {
        // ignore parse errors
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setTimeout(() => {
        if (session?.user?.id) {
          const newEventSource = new EventSource('/api/notifications/stream')
          eventSourceRef.current = newEventSource

          newEventSource.onmessage = (evt) => {
            try {
              const notification = JSON.parse(evt.data) as Notification
              handleRealtimeNotification(notification)
            } catch {
              // ignore
            }
          }
        }
      }, 3000)
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [session?.user?.id, handleRealtimeNotification])

  useEffect(() => {
    if (open) {
      refetch()
    }
  }, [open, refetch])

  if (!session) return null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Button render={<DropdownMenuTrigger />} variant="ghost" size="icon-sm" className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="M16 18C16 20.2091 14.2091 22 12 22C9.79086 22 8 20.2091 8 18" />
          <path d="M4.43654 18H19.5625C20.2903 18 20.6542 18 20.8648 17.8951C21.274 17.6913 21.4929 17.2359 21.3964 16.789C21.3468 16.559 21.1194 16.2749 20.6648 15.7066L20.4951 15.4944C20.0392 14.9246 19.8113 14.6397 19.6184 14.3409C19.0187 13.4119 18.6477 12.354 18.5356 11.254C18.4995 10.9002 18.4995 10.5353 18.4995 9.8056V8.5C18.4995 8.03572 18.4995 7.80358 18.4867 7.60758C18.2898 4.60304 15.8965 2.20977 12.892 2.01285C12.696 2 12.4638 2 11.9995 2C11.5353 2 11.3031 2 11.1071 2.01285C8.10258 2.20977 5.70931 4.60304 5.51239 7.60758C5.49954 7.80358 5.49954 8.03572 5.49954 8.5V9.8056C5.49954 10.5353 5.49954 10.9002 5.46349 11.254C5.35143 12.354 4.98035 13.4119 4.38067 14.3409C3.95985 14.9246 3.50401 15.4944L3.33427 15.7066C2.87964 16.2749 2.65233 16.559 2.60268 16.789C2.50621 17.2359 2.72509 17.6913 3.13431 17.8951C3.3449 18 3.70878 18 4.43654 18Z" />
        </svg>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <p className="text-sm font-medium">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 ${!notification.isRead ? 'bg-muted/50' : ''}`}
                onSelect={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <p className="text-sm font-medium">{notification.title}</p>
                  {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleDateString('id-ID')}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
