'use client'

import type { OwnerBooking } from './page'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserIcon, MapPinIcon, MoneyIcon } from '@hugeicons/core-free-icons'

interface TenantDetailDialogProps {
  booking: OwnerBooking
}

export default function TenantDetailDialog({ booking }: TenantDetailDialogProps) {
  const metadata = booking.metadata as Record<string, unknown> | undefined
  const totalPrice = metadata?.totalPrice ? Number(metadata.totalPrice) : 0
  const dpAmount = metadata?.dpAmount ? Number(metadata.dpAmount) : 0
  const remainingAmount = metadata?.remainingAmount ? Number(metadata.remainingAmount) : 0

  const formatCurrency = (value: number | string | null | undefined) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(Number(value ?? 0))

  const formatDate = (value: string | Date | null | undefined) => {
    if (!value) return '-'
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4" />
          Informasi Tenant
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Nama</p>
            <p className="text-sm font-medium">{booking.userName ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{booking.userEmail ?? '-'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <HugeiconsIcon icon={MapPinIcon} strokeWidth={2} className="size-4" />
          Detail Booking
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Properti</p>
            <p className="text-sm font-medium">{booking.propertyName ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Unit</p>
            <p className="text-sm font-medium">{booking.unitName ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tanggal Mulai</p>
            <p className="text-sm font-medium">{formatDate(booking.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tanggal Selesai</p>
            <p className="text-sm font-medium">{formatDate(booking.endDate)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <HugeiconsIcon icon={MoneyIcon} strokeWidth={2} className="size-4" />
          Pembayaran
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Total Harga</p>
            <p className="text-sm font-medium">{formatCurrency(totalPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">DP (35%)</p>
            <p className="text-sm font-medium">{formatCurrency(dpAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sisa Pembayaran</p>
            <p className="text-sm font-medium">{formatCurrency(remainingAmount)}</p>
          </div>
        </div>
      </div>

      {booking.rejectionReason && (
        <div className="rounded-lg border border-destructive/50 p-4">
          <p className="text-xs text-muted-foreground">Alasan Penolakan</p>
          <p className="text-sm text-destructive">{booking.rejectionReason}</p>
        </div>
      )}
    </div>
  )
}
