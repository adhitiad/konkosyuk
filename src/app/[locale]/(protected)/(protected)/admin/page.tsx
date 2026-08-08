'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { toast } from '@/components/ui/toast'

interface AdminStats {
  totalUsers: number
  totalProperties: number
  totalBookingsToday: number
  totalRevenue: number
}

interface AdminProperty {
  id: string
  name: string
  address: string
  type: string
  ownerName: string | null
  isActive: boolean
  createdAt: string
}

interface AdminBooking {
  id: string
  status: string
  startDate: string
  endDate: string
  propertyName: string | null
  unitName: string | null
  userName: string | null
  userEmail: string | null
  createdAt: string
  metadata: Record<string, unknown>
  propertyId: string
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient()

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, propertiesRes, bookingsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/properties'),
        fetch('/api/bookings'),
      ])

      if (!usersRes.ok || !propertiesRes.ok || !bookingsRes.ok) {
        throw new Error('Failed to fetch stats')
      }

      const usersData = await usersRes.json()
      const propertiesData = await propertiesRes.json()
      const bookingsData = await bookingsRes.json()

      const today = new Date().toISOString().split('T')[0]
      const bookingsList = Array.isArray(bookingsData.data) ? bookingsData.data : []
      const bookingsToday = bookingsList.filter((b: AdminBooking) => b.createdAt?.startsWith(today))

      const revenue = bookingsList
        .filter((b: AdminBooking) => b.status === 'confirmed' || b.status === 'awaiting_full_payment')
        .reduce((sum: number, b: AdminBooking) => {
          const metadata = b.metadata as Record<string, unknown> | undefined
          const totalPrice = metadata?.totalPrice ? Number(metadata.totalPrice) : 0
          return sum + totalPrice
        }, 0)

      return {
        totalUsers: usersData.data?.length ?? 0,
        totalProperties: propertiesData.data?.length ?? 0,
        totalBookingsToday: bookingsToday.length,
        totalRevenue: revenue,
      }
    },
    staleTime: 30000,
  })

  const { data: pendingProperties, isLoading: propertiesLoading } = useQuery<AdminProperty[]>({
    queryKey: ['admin-pending-properties'],
    queryFn: async () => {
      const res = await fetch('/api/properties')
      if (!res.ok) throw new Error('Failed to fetch properties')
      const json = await res.json()
      return (json.data ?? []).filter((p: AdminProperty) => !p.isActive)
    },
    staleTime: 30000,
  })

  const { data: problematicBookings, isLoading: bookingsLoading } = useQuery<AdminBooking[]>({
    queryKey: ['admin-problematic-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings')
      if (!res.ok) throw new Error('Failed to fetch bookings')
      const json = await res.json()
      const bookingsList = Array.isArray(json.data) ? json.data : []
      return bookingsList.filter((b: AdminBooking) => ['rejected', 'cancelled'].includes(b.status))
    },
    staleTime: 30000,
  })

  const approveMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const res = await fetch(`/api/properties/${propertyId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to approve property')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-properties'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast({ title: 'Properti disetujui', description: 'Properti sekarang aktif dan terlihat oleh public.', type: 'success' })
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal menyetujui properti.', type: 'error' })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const res = await fetch(`/api/properties/${propertyId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to reject property')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-properties'] })
      toast({ title: 'Properti ditolak', description: 'Properti tetap nonaktif.', type: 'info' })
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal menolak properti.', type: 'error' })
    },
  })

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(value)

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Kelola dan monitor sistem</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total User</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{stats?.totalUsers ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Properti</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{stats?.totalProperties ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Booking Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{stats?.totalBookingsToday ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Properti Menunggu Approval</CardTitle>
          </CardHeader>
          <CardContent>
            {propertiesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : pendingProperties && pendingProperties.length > 0 ? (
              <div className="space-y-3">
                {pendingProperties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{property.name}</p>
                      <p className="text-xs text-muted-foreground">{property.address} • {property.ownerName}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(property.id)}
                      >
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={rejectMutation.isPending}
                        onClick={() => rejectMutation.mutate(property.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada properti yang menunggu approval.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Bermasalah</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : problematicBookings && problematicBookings.length > 0 ? (
              <div className="space-y-3">
                {problematicBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{booking.propertyName ?? booking.unitName}</p>
                      <p className="text-xs text-muted-foreground">{booking.userName ?? booking.userEmail} • {booking.status}</p>
                    </div>
                    <Badge variant="destructive">{booking.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada booking bermasalah.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
