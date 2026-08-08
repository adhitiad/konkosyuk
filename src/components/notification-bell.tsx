'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { HugeiconsIcon } from '@hugeicons/react'
import { BellIcon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'
import { toast } from '@/components/ui/toast'
import Link from 'next/link'

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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      return res.json()
    },
    staleTime: 30000,
    enabled: !!session,
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to mark as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to mark all as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const notifications: Notification[] = data?.data ?? []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  useEffect(() => {
    if (open) {
      refetch()
    }
  }, [open, refetch])

  if (!session) return null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon-sm" className="relative">
          <HugeiconsIcon icon={BellIcon} strokeWidth={2} className="size-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      } />
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
        <div className="max-h-96 overflow-y-auto">
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
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
