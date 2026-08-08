'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { HeartIcon } from '@hugeicons/core-free-icons'
import { showToastSuccess, showToastError, showToastInfo } from '@/lib/use-toast-custom'

interface FavoriteButtonProps {
  propertyId: string
  initialFavorite?: boolean
}

export default function FavoriteButton({ propertyId, initialFavorite = false }: FavoriteButtonProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [isFavorite, setIsFavorite] = useState(initialFavorite)

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Unauthorized')

      if (isFavorite) {
        const res = await fetch(`/api/favorites/${propertyId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to remove favorite')
        return res.json()
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId }),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || 'Failed to add favorite')
        }
        return res.json()
      }
    },
    onMutate: () => {
      setIsFavorite((prev) => !prev)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      showToastInfo(isFavorite ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit')
    },
    onError: (err) => {
      setIsFavorite((prev) => !prev)
      showToastError(err instanceof Error ? err.message : 'Terjadi kesalahan.')
    },
  })

  if (!session) {
    return null
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={() => toggleMutation.mutate()}
      disabled={toggleMutation.isPending}
    >
      <HugeiconsIcon
        icon={HeartIcon}
        strokeWidth={2}
        className={`size-4 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`}
      />
    </Button>
  )
}
