'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'
import { toast } from '@/components/ui/toast'
import Link from 'next/link'
import FavoriteButton from '@/components/favorite-button'
import { apiClient } from '@/lib/axios'

interface FavoriteProperty {
  id: string
  propertyId: string
  propertyName: string
  propertyAddress: string
  propertyType: string
  propertyBasePrice: string | null
}

interface FavoritesResponse {
  data: FavoriteProperty[]
  meta: { total: number }
}

export default function FavoritesPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery<FavoritesResponse>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/favorites')
      return data
    },
    staleTime: 30000,
  })

  const removeMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const { data } = await apiClient.delete(`/api/favorites/${propertyId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      toast({ title: 'Removed from favorites', type: 'success' })
    },
  })

  const favorites = data?.data ?? []

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground">Properti yang kamu simpan</p>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Gagal memuat favorites.'}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Belum ada favorit</p>
          <p className="text-muted-foreground">Klik heart icon di properti untuk menyimpan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => (
            <Card key={fav.id} className="flex flex-col">
              <div className="relative h-48 w-full bg-muted">
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <span className="text-sm">Gambar tidak tersedia</span>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1">{fav.propertyName}</CardTitle>
                  <Badge variant="secondary">{fav.propertyType === 'kost' ? 'Kost' : 'Kontrakan'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">{fav.propertyAddress}</p>
                <div className="mt-auto flex items-center justify-between">
                  <Badge variant="outline">{fav.propertyAddress}</Badge>
                  <div className="flex gap-2">
                    <FavoriteButton propertyId={fav.propertyId} initialFavorite />
                    <Button render={<Link href={`/properties/${fav.propertyId}`} />} size="sm" nativeButton={false}>
                      Lihat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
