'use client'

import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon, LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HugeiconsIcon } from '@hugeicons/react'
import { MapPinIcon, LoaderPinwheelIcon } from '@hugeicons/core-free-icons'
import { getStructuredAddressFromCoords, type StructuredAddress } from '@/lib/geolocation'

const defaultCenter: LatLngTuple = [-6.2088, 106.8456]

const customIcon = new Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface PropertyMapPickerProps {
  lat?: number | null
  lng?: number | null
  onLocationSelected: (data: {
    lat: number
    lng: number
    address: string
    province: string
    city: string
    district: string
  }) => void
}

function MapClickHandler({
  onLocationSelected,
}: {
  onLocationSelected: (data: {
    lat: number
    lng: number
    address: string
    province: string
    city: string
    district: string
  }) => void
}) {
  const map = useMap()

  const handleClick = useCallback(
    async (e: { latlng: { lat: number; lng: number } }) => {
      const { lat, lng } = e.latlng
      try {
        const address = await getStructuredAddressFromCoords(lat, lng)
        onLocationSelected({
          lat,
          lng,
          address: address.displayName,
          province: address.province,
          city: address.city,
          district: address.district,
        })
      } catch (err) {
        onLocationSelected({
          lat,
          lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          province: '',
          city: '',
          district: '',
        })
      }
    },
    [onLocationSelected],
  )

  map.on('click', handleClick)

  return null
}

export default function PropertyMapPicker({ lat, lng, onLocationSelected }: PropertyMapPickerProps) {
  const [loading, setLoading] = useState(false)
  const position: LatLngTuple | undefined = lat && lng ? [lat, lng] : undefined

  const handleUseCurrentLocation = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { 'User-Agent': 'Konkosyuk/1.0' },
        },
      )
      const data = await response.json()
      const address = data.address || {}
      onLocationSelected({
        lat: lat ?? defaultCenter[0],
        lng: lng ?? defaultCenter[1],
        address: data.display_name || `${lat}, ${lng}`,
        province: address.state || '',
        city: address.city || address.town || address.municipality || '',
        district: address.suburb || address.district || '',
      })
    } catch {
      onLocationSelected({
        lat: lat ?? defaultCenter[0],
        lng: lng ?? defaultCenter[1],
        address: `${lat ?? defaultCenter[0]}, ${lng ?? defaultCenter[1]}`,
        province: '',
        city: '',
        district: '',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-lg overflow-hidden border" style={{ height: '320px' }}>
        <MapContainer
          center={position ?? defaultCenter}
          zoom={position ? 15 : 13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelected={onLocationSelected} />
          {position && (
            <Marker position={position} icon={customIcon}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Lokasi Properti</p>
                  <p className="text-xs text-muted-foreground">
                    {lat!.toFixed(5)}, {lng!.toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Klik peta untuk menandai lokasi properti.</span>
        {position && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <>
                <HugeiconsIcon icon={LoaderPinwheelIcon} strokeWidth={2} className="size-3 animate-spin" />
                Memuat...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={MapPinIcon} strokeWidth={2} className="size-3" />
                Gunakan Lokasi Ini
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
