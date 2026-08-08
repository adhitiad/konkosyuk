'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeftIcon, AlertCircleIcon, StarIcon } from '@hugeicons/core-free-icons'
import { showToastSuccess, showToastError } from '@/lib/use-toast-custom'
import type { Property } from '@/db/schema'

interface PlatformSettings {
  platformFeePercent: string
  featuredListingPrice: string
}

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(value ?? 0))

export default function UpgradeFeaturedPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const propertyId = params.id

  const [selectedProvider, setSelectedProvider] = useState<string>('mock')
  const [isProcessing, setIsProcessing] = useState(false)

  const { data: property, isLoading: propertyLoading } = useQuery<Property>({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${propertyId}`)
      if (!res.ok) throw new Error('Failed to fetch property')
      const json = await res.json()
      return json.data as Property
    },
    enabled: !!propertyId,
  })

  const { data: settings } = useQuery<PlatformSettings>({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings/platform-fee')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const json = await res.json()
      return json.data
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetch(`/api/properties/${propertyId}/checkout-featured`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentProvider: provider }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to create featured listing payment')
      }
      return res.json()
    },
    onSuccess: (data) => {
      if (data.data?.redirectUrl) {
        window.location.href = data.data.redirectUrl
      } else if (data.data?.invoiceNumber) {
        router.push(`/mock-checkout/${data.data.invoiceNumber}`)
      }
    },
    onError: (err) => {
      showToastError(err instanceof Error ? err.message : 'Gagal memproses pembayaran.')
      setIsProcessing(false)
    },
  })

  const featuredPrice = settings?.featuredListingPrice ? Number(settings.featuredListingPrice) : 50000

  const handleUpgrade = async () => {
    setIsProcessing(true)
    try {
      await checkoutMutation.mutateAsync(selectedProvider)
    } catch {
      // handled by onError
    } finally {
      setIsProcessing(false)
    }
  }

  if (propertyLoading) {
    return (
      <div className="container py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Properti tidak ditemukan.</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <HugeiconsIcon icon={ArrowLeftIcon} strokeWidth={2} className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upgrade ke Featured Listing</h1>
          <p className="text-muted-foreground">
            Tingkatkan visibilitas properti &quot;{property.name}&quot;
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-5 text-yellow-500" />
              Benefit Featured Listing
            </CardTitle>
            <CardDescription>
              Properti Anda akan muncul di halaman utama selama 30 hari
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-0.5">1</Badge>
                <div>
                  <p className="font-medium">Posisi Teratas</p>
                  <p className="text-sm text-muted-foreground">Properti muncul di awal hasil pencarian dan halaman utama</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <div>
                  <p className="font-medium">Badge Featured</p>
                  <p className="text-sm text-muted-foreground">Diberi label khusus agar mudah dikenali pengguna</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <div>
                  <p className="font-medium">Durasi 30 Hari</p>
                  <p className="text-sm text-muted-foreground">Properti tetap featured selama 30 hari sejak pembayaran berhasil</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pembayaran</CardTitle>
            <CardDescription>Biaya untuk menampilkan properti di posisi teratas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Harga Featured</span>
                <span className="font-medium">{formatCurrency(featuredPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Durasi</span>
                <span className="font-medium">30 Hari</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(featuredPrice)}</span>
              </div>
            </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Metode Pembayaran</label>
                <Select value={selectedProvider} onValueChange={(value) => value && setSelectedProvider(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mock">Mock Payment (Dev)</SelectItem>
                    <SelectItem value="doku">Doku</SelectItem>
                    <SelectItem value="sakuku">Sakuku</SelectItem>
                    <SelectItem value="nicepay">Nicepay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            <Button
              className="w-full"
              onClick={handleUpgrade}
              disabled={isProcessing || checkoutMutation.isPending}
            >
              {isProcessing || checkoutMutation.isPending ? 'Memproses...' : 'Upgrade Sekarang'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Pembayaran aman dan terenkripsi. Properti akan langsung ter-upgrade setelah pembayaran berhasil.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
