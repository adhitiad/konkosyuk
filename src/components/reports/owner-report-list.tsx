'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wrench, Check, X } from 'lucide-react'

type Report = { id: string; category: string; description: string; images: string[] | null; status: string; propertyName: string; unitName: string | null; tenantName: string | null; createdAt: string }
const categoryLabels: Record<string, string> = { air: 'Air', listrik: 'Listrik', kunci_pintu: 'Kunci pintu', ac: 'AC', furniture: 'Furniture', lainnya: 'Lainnya' }
const statusLabels: Record<string, string> = { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved', rejected: 'Ditolak' }

export default function OwnerReportList() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['maintenance-reports'], queryFn: async () => (await apiClient.get('/api/reports')).data })
  const reports: Report[] = data?.data?.data ?? []
  async function update(id: string, status: 'in_progress' | 'resolved' | 'rejected') {
    await apiClient.patch(`/api/reports/${id}`, { status, resolutionNote: status === 'resolved' ? 'Masalah telah ditangani.' : null })
    queryClient.invalidateQueries({ queryKey: ['maintenance-reports'] })
  }
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="size-5" />Laporan Masalah Tenant</CardTitle></CardHeader><CardContent className="space-y-4">
    {isLoading ? <p className="text-sm text-muted-foreground">Memuat laporan...</p> : reports.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada laporan masalah.</p> : reports.map((report) => <div key={report.id} className="rounded-xl border p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{categoryLabels[report.category] ?? report.category} · {report.propertyName}{report.unitName ? ` · ${report.unitName}` : ''}</p><p className="text-xs text-muted-foreground">{report.tenantName ?? 'Tenant'} · {new Date(report.createdAt).toLocaleDateString('id-ID')}</p></div><Badge className={report.status === 'resolved' ? 'bg-green-100 text-green-700' : report.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}>{statusLabels[report.status] ?? report.status}</Badge></div>
      <p className="text-sm whitespace-pre-wrap">{report.description}</p>{report.images?.length ? <div className="flex flex-wrap gap-2">{report.images.map((url) => <img key={url} src={url} alt="Lampiran laporan" className="size-20 rounded-md border object-cover" />)}</div> : null}
      {report.status !== 'resolved' && report.status !== 'rejected' && <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => update(report.id, 'in_progress')}>Tandai Diproses</Button><Button size="sm" onClick={() => update(report.id, 'resolved')}><Check className="size-4" />Tandai Selesai</Button><Button size="sm" variant="destructive" onClick={() => update(report.id, 'rejected')}><X className="size-4" />Tolak</Button></div>}
    </div>)}
  </CardContent></Card>
}
