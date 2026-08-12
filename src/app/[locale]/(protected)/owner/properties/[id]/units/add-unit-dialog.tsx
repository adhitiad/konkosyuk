'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createUnitSchema, type CreateUnitInput } from '@/lib/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'
import { DialogClose } from '@/components/ui/dialog'
import { apiClient } from '@/lib/axios'

interface AddUnitDialogProps {
  propertyId: string
}

const unitStatusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'booked', label: 'Booked' },
  { value: 'maintenance', label: 'Maintenance' },
]

export default function AddUnitDialog({ propertyId }: AddUnitDialogProps) {
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [capacity, setCapacity] = useState('')
  const [size, setSize] = useState('')
  const [status, setStatus] = useState<CreateUnitInput['status']>('available')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const payload: CreateUnitInput = {
      propertyId,
      name,
      description: description || undefined,
      price,
      capacity: capacity || undefined,
      size: size || undefined,
      status,
    }

    const result = createUnitSchema.safeParse(payload)
    if (!result.success) {
      setError(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await apiClient.post('/api/units', result.data)

      if (res.status >= 400) {
        const text = res.data
        throw new Error(text || 'Gagal menambahkan unit.')
      }

      queryClient.invalidateQueries({ queryKey: ['units', propertyId] })
      resetForm()
      ;(document.querySelector('[data-slot="dialog-close"]') as HTMLElement | null)?.click()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan unit.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setCapacity('')
    setSize('')
    setStatus('available')
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nama Unit</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Kamar 101"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Harga</Label>
        <Input
          id="price"
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Contoh: 2500000"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity">Kapasitas</Label>
          <Input
            id="capacity"
            type="text"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Contoh: 2 orang"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="size">Ukuran (m2)</Label>
          <Input
            id="size"
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="Contoh: 20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as CreateUnitInput['status'])}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Pilih status" />
          </SelectTrigger>
          <SelectContent>
            {unitStatusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsi singkat unit..."
          className="w-full min-h-[80px] rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex justify-end gap-2">
        <DialogClose render={
          <Button type="button" variant="outline">Batal</Button>
        } />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}