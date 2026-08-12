'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSession } from '@/lib/auth-client'

type Notification = { id: string; title: string; message: string; type: string; referenceId: string | null; isRead: boolean; createdAt: string }

export default function NotificationsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page'],
    queryFn: async () => (await apiClient.get('/api/notifications')).data,
  })
  const notifications: Notification[] = data?.data?.data ?? []

  return <div className="container py-6"><Card><CardHeader><CardTitle>Notifikasi</CardTitle></CardHeader><CardContent className="space-y-3">
    {isLoading ? <p className="text-sm text-muted-foreground">Memuat notifikasi...</p> : notifications.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada notifikasi.</p> : notifications.map((notification) => <button key={notification.id} type="button" className={`w-full rounded-xl border p-4 text-left ${!notification.isRead ? 'bg-primary/5' : ''}`} onClick={() => {
      if (notification.type === 'report' && notification.referenceId) router.push((session?.user as { role?: string } | undefined)?.role === 'admin' ? `/admin/maintenance-reports?reportId=${notification.referenceId}` : '/owner/reports')
    }}><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{notification.title}</p><p className="text-sm text-muted-foreground">{notification.message}</p></div><Badge variant="outline">{notification.type}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString('id-ID')}</p></button>)}
  </CardContent></Card></div>
}
