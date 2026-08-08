'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, Edit01Icon, Delete01Icon } from '@hugeicons/core-free-icons'
import { toast } from '@/components/ui/toast'

interface Property {
  id: string
  name: string
  address: string
  type: string
  city: string | null
  basePrice: string | null
  status: string
  isActive: boolean
  isFeatured: boolean
  ownerId: string
  createdAt: string
}

interface PropertyResponse {
  data: Property[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(Number(value ?? 0))

const typeLabel: Record<string, string> = {
  kost: 'Kost',
  kontrakan: 'Kontrakan',
}

export default function AdminPropertiesPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [editName, setEditName] = useState('')
  const [editBasePrice, setEditBasePrice] = useState('')
  const [editIsActive, setEditIsActive] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null)

  const limit = 10

  const { data, isLoading, isError, error } = useQuery<PropertyResponse>({
    queryKey: ['admin-properties', page, search, cityFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (cityFilter) params.set('city', cityFilter)
      if (typeFilter) params.set('type', typeFilter)

      const res = await fetch(`/api/properties?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch properties')
      const json = await res.json()
      return { data: json.data?.data, meta: json.data?.meta }
    },
    staleTime: 30000,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ propertyId, name, basePrice, isActive }: { propertyId: string; name?: string; basePrice?: string; isActive?: boolean }) => {
      const res = await fetch(`/api/admin/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, basePrice, isActive }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to update property')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast({ title: 'Properti diperbarui', description: 'Data properti telah berhasil diperbarui.', type: 'success' })
      setSelectedProperty(null)
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal memperbarui properti.', type: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const res = await fetch(`/api/admin/properties/${propertyId}`, { method: 'DELETE' })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to delete property')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast({ title: 'Properti dihapus', description: 'Properti telah berhasil dihapus.', type: 'success' })
      setDeleteTarget(null)
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal menghapus properti.', type: 'error' })
    },
  })

  const properties: Property[] = Array.isArray(data?.data) ? data.data : []
  const total = data?.meta?.total ?? 0
  const totalPages = data?.meta?.totalPages ?? 1

  const openEdit = (property: Property) => {
    setSelectedProperty(property)
    setEditName(property.name)
    setEditBasePrice(property.basePrice ?? '')
    setEditIsActive(property.isActive)
  }

  const handleSaveEdit = () => {
    if (!selectedProperty) return
    updateMutation.mutate({
      propertyId: selectedProperty.id,
      name: editName !== selectedProperty.name ? editName : undefined,
      basePrice: editBasePrice !== selectedProperty.basePrice ? editBasePrice : undefined,
      isActive: editIsActive !== selectedProperty.isActive ? editIsActive : undefined,
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Properti</h1>
        <p className="text-muted-foreground">Kelola semua properti di sistem</p>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Gagal memuat data properti.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Cari properti..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-sm"
        />
        <Input
          placeholder="Kota"
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1) }}
          className="w-40"
        />
        <Select<string> value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? ''); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Tipe</SelectItem>
            <SelectItem value="kost">Kost</SelectItem>
            <SelectItem value="kontrakan">Kontrakan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Tidak ada properti untuk filter ini.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead>Harga Dasar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktif</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabel[property.type] ?? property.type}</Badge>
                      </TableCell>
                      <TableCell>{property.city ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {property.basePrice ? formatCurrency(property.basePrice) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={property.status === 'nonaktif' ? 'destructive' : 'default'}>
                          {property.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={property.isActive ? 'default' : 'secondary'}>
                          {property.isActive ? 'Disetujui' : 'Menunggu'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {property.isFeatured ? (
                          <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">Featured</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(property)}
                          >
                            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger render={
                              <Button size="sm" variant="destructive">
                                <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
                              </Button>
                            } />
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Konfirmasi Hapus</DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-muted-foreground">
                                Apakah Anda yakin ingin menghapus properti &quot;{property.name}&quot;? Tindakan ini tidak dapat dibatalkan.
                              </p>
                              <div className="flex justify-end gap-2">
                                <DialogTrigger render={
                                  <Button variant="outline">Batal</Button>
                                } />
                                <Button
                                  variant="destructive"
                                  disabled={deleteMutation.isPending}
                                  onClick={() => deleteMutation.mutate(property.id)}
                                >
                                  {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      <Dialog open={!!selectedProperty} onOpenChange={(open) => !open && setSelectedProperty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Properti</DialogTitle>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Properti</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Harga Dasar</label>
                <Input value={editBasePrice} onChange={(e) => setEditBasePrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Aktif</label>
                <Select<string> value={editIsActive ? 'true' : 'false'} onValueChange={(v) => setEditIsActive(v === 'true')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Disetujui</SelectItem>
                    <SelectItem value="false">Menunggu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedProperty(null)}>Batal</Button>
                <Button disabled={updateMutation.isPending} onClick={handleSaveEdit}>
                  {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Properti</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Apakah kamu yakin ingin menghapus properti &quot;{deleteTarget.name}&quot;? Aksi ini tidak bisa dibatalkan.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
                <Button variant="destructive" disabled={deleteMutation.isPending} onClick={handleDelete}>
                  {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
