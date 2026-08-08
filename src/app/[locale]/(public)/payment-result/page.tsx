'use client'

import { useSearchParams } from 'next/navigation'
import { usePaymentPolling } from '@/hooks/use-payment-polling'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, CheckmarkCircle02Icon, Clock01Icon } from '@hugeicons/core-free-icons'

export default function PaymentResultPage() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider')
  const invoiceNumber = searchParams.get('bookingId')

  const { isLoading, isSuccess, isTimeout, attempt, error } = usePaymentPolling({
    invoiceNumber: invoiceNumber ?? undefined,
    intervalMs: 5000,
    maxAttempts: 60,
  })

  const elapsedSeconds = attempt * 5
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  const elapsedSecs = elapsedSeconds % 60

  if (isSuccess) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Pembayaran Berhasil!</h2>
              <p className="text-muted-foreground mt-1">
                Konfirmasi pembayaran telah diterima. Anda akan segera diarahkan ke dashboard.
              </p>
            </div>
            <Button render={<Link href="/dashboard" />} nativeButton={false} className="w-full">
              Ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isTimeout) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Menunggu Konfirmasi</h2>
              <p className="text-muted-foreground mt-1">
                Kami belum menerima konfirmasi pembayaran dari gateway.
              </p>
            </div>
            <Alert variant="destructive">
              <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
              <AlertTitle>Konfirmasi Belum Diterima</AlertTitle>
              <AlertDescription>
                Silakan cek riwayat booking atau hubungi bantuan jika Anda sudah melakukan transfer.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button render={<Link href="/dashboard/bookings" />} nativeButton={false} variant="outline" className="flex-1">
                Cek Riwayat Booking
              </Button>
              <Button render={<Link href="/dashboard" />} nativeButton={false} className="flex-1">
                Ke Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-12 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Spinner className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Menunggu Pembayaran</h2>
            <p className="text-muted-foreground mt-1">
              Silakan selesaikan pembayaran di halaman gateway. Halaman ini akan otomatis memperbarui status.
            </p>
          </div>

          {provider && (
            <div className="text-xs text-muted-foreground capitalize">
              Provider: {provider}
            </div>
          )}

          {invoiceNumber && (
            <div className="text-xs text-muted-foreground font-mono">
              Invoice: {invoiceNumber}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {elapsedMinutes > 0 && `${elapsedMinutes} menit `}
            {elapsedSecs} detik
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button render={<Link href="/dashboard/bookings" />} nativeButton={false} variant="outline" className="w-full">
            Lihat Riwayat Booking
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
