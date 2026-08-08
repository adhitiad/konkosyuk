'use client'

import { useState } from 'react'
import { getCurrentPosition, calculateDistance } from '@/lib/geolocation'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { MapPinIcon, LoaderPinwheelIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface LocationFinderProps {
  onLocationFound: (lat: number, lng: number, radiusKm: number) => void
  onError?: (message: string) => void
}

const radiusOptions = [
  { value: '1', label: '1 km' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
]

export default function LocationFinder({ onLocationFound, onError }: LocationFinderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [radius, setRadius] = useState('5')

  const handleFindLocation = async () => {
    setLoading(true)
    setError(null)

    try {
      const position = await getCurrentPosition()
      onLocationFound(position.lat, position.lng, Number(radius))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mendapatkan lokasi.'
      setError(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFindLocation}
          disabled={loading}
        >
          {loading ? (
            <HugeiconsIcon icon={LoaderPinwheelIcon} strokeWidth={2} className="size-4 animate-spin" />
          ) : (
            <HugeiconsIcon icon={MapPinIcon} strokeWidth={2} className="size-4" />
          )}
          {loading ? 'Mencari...' : 'Lokasi Saya'}
        </Button>
        <select
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className="h-9 rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm"
        >
          {radiusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <Alert variant="destructive" className="text-xs">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
