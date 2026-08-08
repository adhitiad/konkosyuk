'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, WalletIcon } from '@hugeicons/core-free-icons'
import ReviewForm from '@/components/review-form'

interface BalanceLog {
  id: string
  amount: string
  type: string
  description: string
  relatedId: string | null
  createdAt: string
}

interface TransactionResponse {
  data: BalanceLog[]
  currentBalance: string
}

interface BookingItem {
  id: string
  propertyName: string | null
  propertyAddress: string | null
  unitName: string | null
  unitPrice: string | null
  status: string
  startDate: string
  endDate: string
  metadata: Record<string, unknown>
  createdAt: string
  propertyId: string
}

interface BookingResponse {
  data: BookingItem[]
  meta: {
    total: number
  }
}

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(Number(value ?? 0))

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_dp: { label: 'Menunggu Bayar DP', variant: 'secondary' },
  awaiting_owner_approval: { label: 'Menunggu Persetujuan', variant: 'default' },
  awaiting_full_payment: { label: 'Menunggu Pelunasan', variant: 'default' },
  confirmed: { label: 'Dikonfirmasi', variant: 'default' },
  rejected: { label: 'Ditolak', variant: 'destructive' },
  cancelled: { label: 'Dibatalkan', variant: 'destructive' },
}

const transactionTypeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  refund: { label: 'Refund', variant: 'secondary' },
  withdrawal: { label: 'Penarikan', variant: 'destructive' },
  topup: { label: 'Top Up', variant: 'default' },
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null)

  const { data: bookingsData, isLoading: bookingsLoading, isError: bookingsError, error: bookingsErr } = useQuery<BookingResponse>({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings')
      if (!res.ok) throw new Error('Failed to fetch bookings')
      const json = await res.json()
      return json.data as BookingResponse
    },
    staleTime: 30000,
  })

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<TransactionResponse>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await fetch('/api/transactions?limit=10')
      if (!res.ok) throw new Error('Failed to fetch transactions')
      const json = await res.json()
      return json.data as TransactionResponse
    },
    staleTime: 30000,
  })

  const bookings = bookingsData?.data ?? []
  const totalBookings = bookingsData?.meta?.total ?? 0
  const transactions = transactionsData?.data ?? []
  const currentBalance = Number(transactionsData?.currentBalance || 0)

  const stats = {
    total: totalBookings,
    active: bookings.filter((b) => ['confirmed', 'awaiting_full_payment'].includes(b.status)).length,
    pending: bookings.filter((b) => b.status === 'pending_dp').length,
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Saya</h1>
        <p className="text-muted-foreground">Kelola dan pantau semua bookingmu</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Booking</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{stats.total}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Booking Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{stats.active}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Menunggu Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{stats.pending}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={WalletIcon} strokeWidth={2} className="size-5" />
            Saldo Saya
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-3xl font-bold">{formatCurrency(currentBalance)}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Saldo Anda akan digunakan untuk pembayaran booking selanjutnya.
          </p>
        </CardContent>
      </Card>

      {bookingsError && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {bookingsErr instanceof Error ? bookingsErr.message : 'Gagal memuat data booking.'}
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Riwayat Mutasi Saldo</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">Belum ada mutasi saldo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Deskripsi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const txStatus = transactionTypeConfig[tx.type] ?? { label: tx.type, variant: 'outline' }
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={txStatus.variant}>{txStatus.label}</Badge>
                        </TableCell>
                        <TableCell className={tx.type === 'refund' || tx.type === 'topup' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {tx.type === 'refund' || tx.type === 'topup' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {tx.description}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Booking Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">Belum ada booking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Booking</TableHead>
                    <TableHead>Properti & Unit</TableHead>
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>DP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => {
                    const metadata = booking.metadata as Record<string, unknown> | undefined
                    const totalPrice = metadata?.totalPrice ? Number(metadata.totalPrice) : 0
                    const dpAmount = metadata?.dpAmount ? Number(metadata.dpAmount) : 0
                    const config = statusConfig[booking.status] ?? { label: booking.status, variant: 'outline' }

                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-xs">
                          {booking.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.propertyName ?? '-'}</span>
                            <span className="text-xs text-muted-foreground">{booking.unitName ?? '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(booking.startDate)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatCurrency(totalPrice)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatCurrency(dpAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {booking.status === 'pending_dp' && (
                            <Button render={<Link href={`/dashboard/bookings/${booking.id}/checkout?purpose=dp`} />} size="sm" variant="default" nativeButton={false}>
                              Bayar DP
                            </Button>
                          )}
                          {booking.status === 'awaiting_full_payment' && (
                            <Button render={<Link href={`/dashboard/bookings/${booking.id}/checkout?purpose=full_payment`} />} size="sm" variant="default" nativeButton={false}>
                              Bayar Pelunasan
                            </Button>
                          )}
                          {(booking.status === 'confirmed' || booking.status === 'completed') && new Date(booking.endDate) < new Date() && (
                            <Dialog open={reviewBookingId === booking.id} onOpenChange={(open) => !open && setReviewBookingId(null)}>
                              <DialogTrigger render={
                                <Button size="sm" variant="outline" onClick={() => setReviewBookingId(booking.id)}>
                                  Beri Rating
                                </Button>
                              } />
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Beri Rating Properti</DialogTitle>
                                </DialogHeader>
                                <ReviewForm
                                  bookingId={booking.id}
                                  type="property"
                                  targetId={booking.propertyId}
                                  targetName={booking.propertyName ?? 'Properti'}
                                  onSuccess={() => setReviewBookingId(null)}
                                />
                              </DialogContent>
                            </Dialog>
                          )}
                          {booking.status === 'confirmed' && new Date(booking.endDate) >= new Date() && (
                            <Button render={<Link href={`/dashboard/bookings/${booking.id}`} />} size="sm" variant="outline" nativeButton={false}>
                              Lihat Detail
                            </Button>
                          )}
                          {(booking.status === 'rejected' || booking.status === 'cancelled') && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
