'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { showToastSuccess, showToastError } from '@/lib/use-toast-custom'
import { apiClient } from '@/lib/axios'

function formatIDR(amount: string): string {
  const num = parseFloat(amount)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return <Badge variant="default">Berhasil</Badge>
    case 'failed':
      return <Badge variant="destructive">Gagal</Badge>
    case 'expired':
      return <Badge variant="secondary">Kadaluarsa</Badge>
    default:
      return <Badge variant="outline">Menunggu</Badge>
  }
}

export default function MockCheckoutPage({
  params,
}: {
  params: { invoiceNumber: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<{
    id: string
    bookingId: string
    propertyId: string | null
    provider: string
    purpose: string
    amount: string
    currency: string
    status: string
    transactionId: string | null
    paidAt: string | null
    createdAt: string
    bookingStatus: string | null
    bookingType: string | null
  } | null>(null)
  const [fetching, setFetching] = useState(true)

  const fetchPayment = async () => {
    try {
      setFetching(true)
      const { data } = await apiClient.get('/api/payments', {
        params: { invoiceNumber: params.invoiceNumber },
      })
      if (data.error) {
        throw new Error(data.error ?? 'Gagal mengambil data pembayaran')
      }
      setPayment(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setFetching(false)
    }
  }

  const handleSimulate = async (status: 'success' | 'failed' | 'expired') => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.post('/api/webhooks/mock', {
        invoiceNumber: params.invoiceNumber,
        status,
      })
      const data = res.data
      if (res.status >= 400) {
        throw new Error(data.error ?? 'Gagal memproses simulasi')
      }

      if (status === 'success') {
        if (payment?.purpose === 'featured_listing') {
          showToastSuccess('Pembayaran berhasil! Properti Anda sekarang Featured.')
        } else {
          showToastSuccess('Pembayaran berhasil! Status booking diperbarui.')
        }
      } else {
        showToastError('Pembayaran gagal atau kedaluwarsa.')
      }
      setTimeout(() => {
        if (payment?.purpose === 'featured_listing') {
          router.push('/owner/properties')
        } else {
          router.push('/dashboard/bookings')
        }
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      showToastError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="container mx-auto py-8 max-w-lg">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error && !payment) {
    return (
      <div className="container mx-auto py-8 max-w-lg">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchPayment} className="mt-4">
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="container mx-auto py-8 max-w-lg">
        <Card>
          <CardContent className="pt-6">
            <p>Pembayaran tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Mock Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invoice</span>
            <span className="font-mono text-sm">{params.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jumlah</span>
            <span className="font-semibold">{formatIDR(payment.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tujuan</span>
            <span>
              {payment.purpose === 'dp' ? 'DP' : payment.purpose === 'featured_listing' ? 'Featured Listing' : 'Pelunasan'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            {getStatusBadge(payment.status)}
          </div>

          {error && (
            <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            <Dialog>
              <DialogTrigger>
                <Button className="w-full" variant="default">
                  Simulasi Bayar Sukses
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Konfirmasi</DialogTitle>
                  <DialogDescription>
                    Apakah Anda yakin ingin mensimulasikan pembayaran sukses
                    untuk invoice {params.invoiceNumber}?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Batal</Button>
                  <Button
                    onClick={() => handleSimulate('success')}
                    disabled={loading}
                  >
                    {loading ? 'Memproses...' : 'Ya, Simulasi Sukses'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger>
                <Button className="w-full" variant="destructive">
                  Simulasi Bayar Gagal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Konfirmasi</DialogTitle>
                  <DialogDescription>
                    Apakah Anda yakin ingin mensimulasikan pembayaran gagal
                    untuk invoice {params.invoiceNumber}?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Batal</Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleSimulate('failed')}
                    disabled={loading}
                  >
                    {loading ? 'Memproses...' : 'Ya, Simulasi Gagal'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger>
                <Button className="w-full" variant="secondary">
                  Simulasi Expired
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Konfirmasi</DialogTitle>
                  <DialogDescription>
                    Apakah Anda yakin ingin mensimulasikan pembayaran expired
                    untuk invoice {params.invoiceNumber}?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Batal</Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleSimulate('expired')}
                    disabled={loading}
                  >
                    {loading ? 'Memproses...' : 'Ya, Simulasi Expired'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}