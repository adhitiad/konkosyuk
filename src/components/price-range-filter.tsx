'use client'

import { Input } from '@/components/ui/input'

interface PriceRangeFilterProps {
  minPrice: string
  maxPrice: string
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
}

export default function PriceRangeFilter({ minPrice, maxPrice, onMinChange, onMaxChange }: PriceRangeFilterProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Rentang Harga</label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={minPrice}
          onChange={(e) => onMinChange(e.target.value)}
          min={0}
        />
        <span className="text-muted-foreground">-</span>
        <Input
          type="number"
          placeholder="Max"
          value={maxPrice}
          onChange={(e) => onMaxChange(e.target.value)}
          min={0}
        />
      </div>
    </div>
  )
}
