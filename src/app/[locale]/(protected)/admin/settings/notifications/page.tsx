'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, MessageCircle } from 'lucide-react'
import { apiClient } from '@/lib/axios'
import { withAdminAuth } from '@/lib/with-admin-auth'

type NotificationSettings = { email: { configured: boolean; sender: string }; whatsapp: { configured: boolean; createdTemplate: string; updatedTemplate: string } }

function NotificationSettingsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['notification-settings'], queryFn: async () => (await apiClient.get('/api/admin/settings/notifications')).data })
  const settings = data?.data as NotificationSettings | undefined
  const status = (configured?: boolean) => <Badge variant={configured ? 'default' : 'destructive'}>{configured ? 'Aktif' : 'Belum dikonfigurasi'}</Badge>

  return <div className="container py-6 space-y-6"><div><h1 className="text-3xl font-bold">Pengaturan Notifikasi</h1><p className="text-muted-foreground">Konfigurasi pengiriman Email dan WhatsApp untuk laporan masalah.</p></div>{isLoading ? <p>Memuat konfigurasi...</p> : <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Mail className="size-5" />Email Resend {status(settings?.email.configured)}</CardTitle><CardDescription>Notifikasi laporan baru dan perubahan status.</CardDescription></CardHeader><CardContent><p className="text-sm">Sender: {settings?.email.sender}</p><p className="mt-2 text-xs text-muted-foreground">API key hanya dibaca dari environment server.</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="size-5" />WhatsApp Meta {status(settings?.whatsapp.configured)}</CardTitle><CardDescription>Memakai template WhatsApp yang telah disetujui Meta.</CardDescription></CardHeader><CardContent className="space-y-2 text-sm"><p>Template laporan baru: <code>{settings?.whatsapp.createdTemplate}</code></p><p>Template status update: <code>{settings?.whatsapp.updatedTemplate}</code></p></CardContent></Card></div>}</div>
}

export default withAdminAuth(NotificationSettingsPage, ['admin'])
