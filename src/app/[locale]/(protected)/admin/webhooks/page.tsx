'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { AlertCircleIcon, Refresh01Icon } from '@hugeicons/core-free-icons'
import { toast } from '@/components/ui/toast'
import { apiClient } from '@/lib/axios'
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav'
import { withAdminAuth } from '@/lib/with-admin-auth'

interface WebhookEvent {
  id: string
  provider: string
  eventId: string
  eventType: string | null
  payload: Record<string, unknown>
  signatureValid: boolean
  processedAt: string | null
  createdAt: string
}

interface WebhookResponse {
  data: WebhookEvent[]
  meta: {
    total: number
  }
}

const providerOptions = [
  { value: '', label: 'Semua Provider' },
  { value: 'doku', label: 'Doku' },
  { value: 'ipaymu', label: 'iPaymu' },
  { value: 'nicepay', label: 'NicePay' },
]

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'processed', label: 'Processed' },
  { value: 'pending', label: 'Pending' },
]

export default withAdminAuth(AdminWebhooksPage)

function AdminWebhooksPage() {
  const [provider, setProvider] = useState('')
  const [status, setStatus] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery<WebhookResponse>({
    queryKey: ['admin-webhooks', provider, status],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (provider) params.set('provider', provider)
      if (status) params.set('status', status)

      const { data: json } = await apiClient.get(`/api/admin/webhooks?${params.toString()}`)
      return { data: json.data?.data, meta: json.data?.meta }
    },
    staleTime: 30000,
  })

  const reprocessMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const { data } = await apiClient.patch('/api/admin/webhooks', { id: webhookId })
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] })
      toast({ title: 'Webhook berhasil diproses ulang', type: 'success' })
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal memproses ulang webhook.', type: 'error' })
    },
  })

  const webhooks: WebhookEvent[] = Array.isArray(data?.data) ? data.data : []

  const formatDate = (value: string | null) => {
    if (!value) return '-'
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(value))
  }

  const formatJson = (obj: Record<string, unknown>) => {
    return JSON.stringify(obj, null, 2)
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <BreadcrumbNav items={[{ label: 'Dashboard', href: '/admin' }, { label: 'Webhook Monitoring' }]} />
        <h1 className="text-2xl font-bold tracking-tight">Webhook Monitoring</h1>
        <p className="text-muted-foreground">Monitor webhook events dari payment gateway</p>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Gagal memuat data webhook.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <Select<string> value={provider} onValueChange={(v) => setProvider(v ?? '')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Provider" />
          </SelectTrigger>
          <SelectContent>
            {providerOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select<string> value={status} onValueChange={(v) => setStatus(v ?? '')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Events</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : webhooks.length > 0 ? (
            <div className="space-y-3">
              {webhooks.map((event: WebhookEvent) => (
                <div
                  key={event.id}
                  className={`rounded-lg border p-4 ${
                    !event.signatureValid ? 'border-destructive bg-destructive/5' : ''
                  }`}
                >
                   <div className="flex flex-wrap items-start justify-between gap-2">
                     <div className="space-y-1">
                       <div className="flex items-center gap-2">
                         <Badge variant="outline">{event.provider}</Badge>
                         <Badge variant={event.signatureValid ? 'default' : 'destructive'}>
                           {event.signatureValid ? 'Signature Valid' : 'Signature Invalid'}
                         </Badge>
                         {event.processedAt ? (
                           <Badge variant="secondary">Processed</Badge>
                         ) : (
                           <Badge variant="outline">Pending</Badge>
                         )}
                       </div>
                       <p className="text-sm font-mono">Event ID: {event.eventId}</p>
                       <p className="text-sm text-muted-foreground">Type: {event.eventType ?? '-'}</p>
                       <p className="text-xs text-muted-foreground">
                         Created: {formatDate(event.createdAt)} | Processed: {formatDate(event.processedAt)}
                       </p>
                     </div>
                     {!event.processedAt && (
                       <Button
                         size="sm"
                         variant="outline"
                         disabled={reprocessMutation.isPending}
                         onClick={() => reprocessMutation.mutate(event.id)}
                       >
                         <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} className="size-4 mr-1" />
                         Proses Ulang
                       </Button>
                     )}
                   </div>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      View Payload
                    </summary>
                    <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs">
                      {formatJson(event.payload)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tidak ada webhook event untuk filter ini.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
