'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'
import { CheckCircle2 } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import type { Role } from '@/lib/auth'
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav'
import { apiClient } from '@/lib/axios'
import { withAdminAuth } from '@/lib/with-admin-auth'

interface AdminNotification {
  id: string
  title: string
  message: string
  type: string
  referenceId: string | null
  isRead: boolean
  createdAt: string
  userName: string | null
  userEmail: string | null
}

interface AdminNotificationsResponse {
  data: AdminNotification[]
  meta: {
    total: number
  }
}

const typeOptions = [
  { value: '', label: 'Semua Tipe' },
  { value: 'booking', label: 'Booking' },
  { value: 'payment', label: 'Payment' },
  { value: 'system', label: 'System' },
  { value: 'report', label: 'Laporan Masalah' },
]

const readOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'true', label: 'Sudah Dibaca' },
  { value: 'false', label: 'Belum Dibaca' },
]

export default withAdminAuth(AdminNotificationsPage)

function AdminNotificationsPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [type, setType] = useState<string | null>(null)
  const [isRead, setIsRead] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, error } = useQuery<AdminNotificationsResponse>({
    queryKey: ['admin-notifications', type, isRead, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (type) params.set('type', type)
      if (isRead) params.set('isRead', isRead)
      if (search) params.set('search', search)

      const { data: json } = await apiClient.get(`/api/admin/notifications?${params.toString()}`)
      return { data: json.data?.data, meta: json.data?.meta }
    },
    staleTime: 30000,
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await apiClient.patch('/api/admin/notifications', { notificationId, isRead: true })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      toast({ title: 'Notifikasi ditandai sebagai dibaca', type: 'success' })
    },
    onError: () => {
      toast({ title: 'Gagal menandai notifikasi', type: 'error' })
    },
  })

  const notifications: AdminNotification[] = Array.isArray(data?.data) ? data.data : []

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      booking: 'default',
      payment: 'secondary',
      system: 'destructive',
      report: 'outline',
    }
    return variants[type] || 'outline'
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <BreadcrumbNav items={[{ label: 'Dashboard', href: '/admin' }, { label: 'Notifikasi' }]} />
        <h1 className="text-3xl font-bold tracking-tight">Notifikasi</h1>
        <p className="text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label htmlFor="search-notifications" className="sr-only">Cari notifikasi</label>
              <Input
                id="search-notifications"
                placeholder="Cari notifikasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter tipe" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={isRead} onValueChange={setIsRead}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {readOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error instanceof Error ? error.message : 'Gagal memuat notifikasi'}</AlertDescription>
            </Alert>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  role={notification.type === 'report' && notification.referenceId ? 'button' : undefined}
                  tabIndex={notification.type === 'report' && notification.referenceId ? 0 : undefined}
                  className={`flex items-start gap-4 rounded-4xl border p-4 transition-colors ${
                    !notification.isRead ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                  onClick={() => {
                    if (notification.type === 'report' && notification.referenceId) {
                      if (!notification.isRead) markAsReadMutation.mutate(notification.id)
                      router.push(`/admin/maintenance-reports?reportId=${notification.referenceId}`)
                    }
                  }}
                >
                  <div className="mt-1">
                    {notification.isRead ? (
                      <CheckCircle2 className="size-5 text-muted-foreground" />
                    ) : (
                      <div className="size-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <Badge variant={getTypeBadge(notification.type)} className="text-xs">
                        {notification.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatDate(notification.createdAt)}</span>
                      {notification.userName && <span>User: {notification.userName}</span>}
                      {notification.userEmail && <span>{notification.userEmail}</span>}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={markAsReadMutation.isPending}
                      onClick={(event) => {
                        event.stopPropagation()
                        markAsReadMutation.mutate(notification.id)
                      }}
                    >
                      {markAsReadMutation.isPending ? 'Memproses...' : 'Tandai dibaca'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
