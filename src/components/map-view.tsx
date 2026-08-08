'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import { Icon, LatLngBoundsExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { HugeiconsIcon } from '@hugeicons/react'
import { MapPinIcon } from '@hugeicons/core-free-icons'

interface MarkerData {
  id: string
  lat: number
  lng: number
  title: string
  popup?: string
  isJittered?: boolean
}

interface MapViewProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers: MarkerData[]
  height?: string
}

const customIcon = new Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function FitBounds({ markers }: { markers: MarkerData[] }) {
  const map = useMap()

  if (markers.length > 0) {
    const bounds: LatLngBoundsExpression = markers.map((m) => [m.lat, m.lng])
    map.fitBounds(bounds, { padding: [50, 50] })
  }

  return null
}

export default function MapView({ center, zoom = 13, markers, height = '400px' }: MapViewProps) {
  const defaultCenter = center ?? { lat: -6.2088, lng: 106.8456 }

  return (
    <div style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}>
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.length > 0 && <FitBounds markers={markers} />}
        {markers.map((marker) =>
          marker.isJittered ? (
            <Circle
              key={marker.id}
              center={[marker.lat, marker.lng]}
              radius={500}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#06b6d4',
                fillOpacity: 0.2,
                weight: 2,
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{marker.title}</p>
                  <p className="text-xs text-muted-foreground">Lokasi Perkiraan Properti</p>
                </div>
              </Popup>
            </Circle>
          ) : (
            <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={customIcon}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{marker.title}</p>
                  {marker.popup && <p className="text-xs text-muted-foreground">{marker.popup}</p>}
                </div>
              </Popup>
            </Marker>
          ),
        )}
      </MapContainer>
    </div>
  )
}
