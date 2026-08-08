'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HugeiconsIcon } from '@hugeicons/react'
import { WifiIcon, Home01Icon } from '@hugeicons/core-free-icons'

const amenitiesList = [
  { value: 'wifi', label: 'WiFi', icon: WifiIcon },
  { value: 'ac', label: 'AC', icon: Home01Icon },
  { value: 'parkir_motor', label: 'Parkir Motor', icon: Home01Icon },
  { value: 'parkir_mobil', label: 'Parkir Mobil', icon: Home01Icon },
  { value: 'laundry', label: 'Laundry', icon: Home01Icon },
  { value: 'dapur', label: 'Dapur', icon: Home01Icon },
  { value: 'kamar_mandi_dalam', label: 'Kamar Mandi Dalam', icon: Home01Icon },
  { value: 'balcony', label: 'Balcony', icon: Home01Icon },
]

interface AmenitiesFilterProps {
  selected: string[]
  onChange: (amenities: string[]) => void
}

export default function AmenitiesFilter({ selected, onChange }: AmenitiesFilterProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((a) => a !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Amenities</label>
      <div className="flex flex-wrap gap-2">
        {amenitiesList.map((amenity) => {
          const Icon = amenity.icon
          const isSelected = selected.includes(amenity.value)
          return (
            <Button
              key={amenity.value}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggle(amenity.value)}
            >
              <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-4 mr-1" />
              {amenity.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
