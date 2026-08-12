'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import { apiClient } from '@/lib/axios'
import { showToastSuccess, showToastError } from '@/lib/use-toast-custom'

interface BookingRequestWithDetails {
  id: string
  numOccupants: number
  startDate: string
  status: string
  agreedPrice: string | null
  createdAt: string
  tenantName: string | null
  tenantEmail: string | null
  unitName: string | null
  propertyName: string | null
  unitCapacity: string | null
  matchedPrice: number | null
}

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(Number(value ?? 0))

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default function OwnerBookingRequestsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [agreedPrice, setAgreedPrice] = useState<string>('')
  const [rejectReason, setRejectReason] = useState<string>('')

  const { data, isLoading, isError, error } = useQuery<{ data: BookingRequestWithDetails[] }>({
    queryKey: ['owner-booking-requests'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/owner/booking-requests')
      return data
    },
    staleTime: 30000,
    enabled: !!session?.user?.id,
  })

  const approveMutation = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const { data } = await apiClient.patch(`/api/owner/booking-requests/${id}`, {
        status: 'approved',
        agreedPrice: price,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-booking-requests'] })
      setReviewingId(null)
      setAgreedPrice('')
      showToastSuccess('Permintaan booking berhasil disetujui dan invoice DP telah dibuat.')
    },
    onError: (err: unknown) => {
      showToastError(err instanceof Error ? err.message : 'Gagal menyetujui booking')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(`/api/owner/booking-requests/${id}`, {
        status: 'rejected',
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-booking-requests'] })
      setReviewingId(null)
      setRejectReason('')
      showToastSuccess('Permintaan booking ditolak.')
    },
    onError: (err: unknown) => {
      showToastError(err instanceof Error ? err.message : 'Gagal menolak booking')
    },
  })

  const requests = data?.data ?? []

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Permintaan Sewa</h1>
        <p className="text-muted-foreground">
          Kelola permintaan sewa kamar dari tenant untuk properti Anda
        </p>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Gagal memuat data permintaan.'}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Belum ada permintaan sewa yang masuk.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => {
            const tierPrice = request.matchedPrice

            return (
              <Card key={request.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">
                      {request.tenantName ?? 'Tenant'}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {request.numOccupants} penghuni
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{request.tenantEmail}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{request.propertyName ?? '-'}</p>
                    <p className="text-xs text-muted-foreground">Unit: {request.unitName ?? '-'}</p>
                    <p className="text-xs text-muted-foreground">Mulai: {formatDate(request.startDate)}</p>
                  </div>

                  <div className="rounded-4xl border p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Harga Sewa</p>
                    <p className="text-sm font-semibold text-primary">
                      {tierPrice !== null ? formatCurrency(tierPrice) : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">DP 35%: {formatCurrency(tierPrice !== null ? tierPrice * 0.35 : 0)}</p>
                  </div>

                  {reviewingId === request.id ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`price-${request.id}`}>Harga Disetujui (Rp)</Label>
                        <Input
                          id={`price-${request.id}`}
                          type="number"
                          value={agreedPrice}
                          onChange={(e) => setAgreedPrice(e.target.value)}
                          placeholder="Masukkan harga sewa"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => rejectMutation.mutate(request.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-4" />
                          Tolak
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const price = Number(agreedPrice)
                            if (price <= 0) {
                              showToastError('Masukkan harga yang valid')
                              return
                            }
                            approveMutation.mutate({ id: request.id, price })
                          }}
                          disabled={approveMutation.isPending}
                        >
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-4" />
                          Terima & Kirim Tagihan DP
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setReviewingId(request.id)
                          setAgreedPrice(tierPrice !== null ? String(tierPrice) : '')
                        }}
                      >
                        Proses
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
