'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, EyeIcon } from '@hugeicons/core-free-icons'
import MaintenanceTicketForm from '@/components/maintenance/maintenance-ticket-form'
import type { MaintenanceTicket } from '@/db/schema'
import { apiClient } from '@/lib/axios'
import ReportForm from '@/components/reports/report-form'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  reported: { label: 'Dilaporkan', variant: 'secondary' },
  in_progress: { label: 'Ditangani', variant: 'default' },
  resolved: { label: 'Selesai', variant: 'default' },
  cancelled: { label: 'Dibatalkan', variant: 'destructive' },
}

const priorityConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  low: { label: 'Rendah', variant: 'outline' },
  medium: { label: 'Sedang', variant: 'secondary' },
  high: { label: 'Tinggi', variant: 'default' },
  urgent: { label: 'Urgent', variant: 'destructive' },
}

export default function TenantMaintenancePage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['maintenance-tickets'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/maintenance')
      return data
    },
    staleTime: 30000,
  })

  const tickets = data?.data ?? []

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">Laporkan dan pantau kerusakan unit Anda</p>
        </div>
        <MaintenanceTicketForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] })} />
      </div>

      <div className="mb-6"><ReportForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['maintenance-reports'] })} /></div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Gagal memuat data tiket.'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Tiket</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">Belum ada tiket maintenance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket: MaintenanceTicket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.title}</TableCell>
                      <TableCell>{ticket.unitId.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant={priorityConfig[ticket.priority]?.variant ?? 'outline'}>
                          {priorityConfig[ticket.priority]?.label ?? ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[ticket.status]?.variant ?? 'outline'}>
                          {statusConfig[ticket.status]?.label ?? ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-4" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Tiket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Judul</p>
                  <p className="text-sm font-medium">{selectedTicket.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={statusConfig[selectedTicket.status]?.variant ?? 'outline'}>
                    {statusConfig[selectedTicket.status]?.label ?? selectedTicket.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prioritas</p>
                  <Badge variant={priorityConfig[selectedTicket.priority]?.variant ?? 'outline'}>
                    {priorityConfig[selectedTicket.priority]?.label ?? selectedTicket.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p className="text-sm font-medium">{selectedTicket.unitId.slice(0, 8)}...</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deskripsi</p>
                <p className="text-sm">{selectedTicket.description}</p>
              </div>
              {selectedTicket.ownerNotes && (
                <div>
                  <p className="text-xs text-muted-foreground">Catatan Owner</p>
                  <p className="text-sm">{selectedTicket.ownerNotes}</p>
                </div>
              )}
              {selectedTicket.images && selectedTicket.images.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Gambar</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.images.map((url, idx) => (
                      <img key={idx} src={url} alt={`Attachment ${idx + 1}`} className="h-20 w-20 object-cover rounded-lg border" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
