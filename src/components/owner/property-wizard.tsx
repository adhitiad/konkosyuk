'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { uploadFile } from '@/lib/storage-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, Add01Icon, Location02Icon, Delete01Icon, PencilIcon } from '@hugeicons/core-free-icons'
import { Dropzone } from '@/components/owner/dropzone'
import PackageForm from '@/components/owner/package-form'
import { PropertyImagesUpload } from '@/components/property/property-images-upload'
import type { PropertyPackages } from '@/lib/types/property-packages'
import type { Tag } from '@/db/schema'
import { PROVINCES, CITIES_BY_PROVINCE } from '@/lib/constants/indonesia-regions'

interface Unit {
  _tempId: string
  name: string
  price: number
  status: 'available' | 'booked' | 'maintenance'
  description?: string
  images: string[]
}

interface Step1Data {
  title: string
  type: 'kost' | 'kontrakan' | 'ruko'
  province: string
  city: string
  address: string
  latitude?: number
  longitude?: number
  selectedTagIds: string[]
  images: string[]
  packages: PropertyPackages | null
  amenities: string[]
  description: string
}

const propertyTypeOptions = [
  { value: 'kost', label: 'Kost' },
  { value: 'kontrakan', label: 'Kontrakan' },
  { value: 'ruko', label: 'Ruko' },
]

const commonAmenities = [
  'WiFi',
  'AC',
  'Laundry',
  'Parkir Motor',
  'Parkir Mobil',
  'Dapur',
  'Kamar Mandi Dalam',
  'Balcony',
]

export default function PropertyWizard() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(1)
  const [step1, setStep1] = useState<Step1Data>({
    title: '',
    type: 'kost',
    province: '',
    city: '',
    address: '',
    selectedTagIds: [],
    images: [],
    packages: null,
    amenities: [],
    description: '',
  })
  const [units, setUnits] = useState<Unit[]>([])
  const [unitFilesMap, setUnitFilesMap] = useState<Record<string, File[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unitDialogOpen, setUnitDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

  const [unitForm, setUnitForm] = useState({
    name: '',
    price: '',
    status: 'available' as Unit['status'],
    description: '',
  })

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/owner/tags')
      return data.data as Tag[]
    },
  })

  const facilityTags = tagsData?.filter((t) => t.category === 'facility') ?? []
  const ruleTags = tagsData?.filter((t) => t.category === 'rule') ?? []

  const availableCities = step1.province ? CITIES_BY_PROVINCE[step1.province] || [] : []
  const imageCount = step1.images.length
  const canProceedStep1 = step1.title.trim().length > 0 && step1.address.trim().length >= 10 && step1.province && step1.city && imageCount >= 3

  const updateStep1 = (patch: Partial<Step1Data>) => {
    setStep1((prev) => ({ ...prev, ...patch }))
  }

  const toggleTag = (tagId: string) => {
    setStep1((prev) => ({
      ...prev,
      selectedTagIds: prev.selectedTagIds.includes(tagId)
        ? prev.selectedTagIds.filter((id) => id !== tagId)
        : [...prev.selectedTagIds, tagId],
    }))
  }

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser ini.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateStep1({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        })
      },
      () => {
        setError('Gagal mendapatkan lokasi. Izinkan akses lokasi di browser.')
      },
    )
  }

  const addAmenity = (value: string) => {
    const trimmed = value.trim()
    if (trimmed && !step1.amenities.includes(trimmed)) {
      updateStep1({ amenities: [...step1.amenities, trimmed] })
    }
  }

  const removeAmenity = (value: string) => {
    updateStep1({ amenities: step1.amenities.filter((a) => a !== value) })
  }

  const openAddUnit = () => {
    setEditingUnit(null)
    setUnitForm({ name: '', price: '', status: 'available', description: '' })
    setUnitDialogOpen(true)
  }

  const openEditUnit = (unit: Unit) => {
    setEditingUnit(unit)
    setUnitForm({
      name: unit.name,
      price: String(unit.price),
      status: unit.status,
      description: unit.description || '',
    })
    setUnitDialogOpen(true)
  }

  const saveUnit = () => {
    if (!unitForm.name.trim() || !unitForm.price) return

    if (editingUnit) {
      setUnits((prev) =>
        prev.map((u) =>
          u._tempId === editingUnit._tempId
            ? { ...u, name: unitForm.name, price: Number(unitForm.price), status: unitForm.status, description: unitForm.description || undefined }
            : u,
        ),
      )
    } else {
      const newUnit: Unit = {
        _tempId: crypto.randomUUID(),
        name: unitForm.name,
        price: Number(unitForm.price),
        status: unitForm.status,
        description: unitForm.description || undefined,
        images: [],
      }
      setUnits((prev) => [...prev, newUnit])
    }
    setUnitDialogOpen(false)
    setUnitForm({ name: '', price: '', status: 'available', description: '' })
    setEditingUnit(null)
  }

  const removeUnit = (tempId: string) => {
    setUnits((prev) => prev.filter((u) => u._tempId !== tempId))
  }

  const uploadUnitImages = async (unit: Unit, files: File[]): Promise<Unit> => {
    if (files.length === 0) return unit
    const urls: string[] = []
    for (const file of files) {
      const result = await uploadFile(file, 'property')
      urls.push(result.url)
    }
    return { ...unit, images: [...unit.images, ...urls] }
  }

  const handleSaveAll = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const payload = {
        title: step1.title,
        type: step1.type as 'kost' | 'kontrakan',
        address: step1.address,
        province: step1.province,
        city: step1.city,
        description: step1.description || undefined,
        packages: step1.packages || undefined,
        amenities: step1.amenities,
        images: step1.images,
        status: 'aktif' as const,
        latitude: step1.latitude,
        longitude: step1.longitude,
      }

      const res = await apiClient.post('/api/properties', payload)
      if (res.status >= 400) {
        throw new Error(res.data?.error || 'Gagal menambahkan properti')
      }

      const propertyId = res.data?.data?.id
      if (!propertyId) {
        throw new Error('Gagal mendapatkan ID properti')
      }

      for (const unit of units) {
        const enrichedUnit = await uploadUnitImages(unit, unitFilesMap[unit._tempId] || [])
        const unitRes = await apiClient.post(`/api/owner/properties/${propertyId}/units`, {
          name: enrichedUnit.name,
          price: enrichedUnit.price,
          status: enrichedUnit.status,
          description: enrichedUnit.description,
        })
        if (unitRes.status >= 400) {
          throw new Error(unitRes.data?.error || 'Gagal menambahkan unit')
        }
      }

      queryClient.invalidateQueries({ queryKey: ['properties'] })
      alert('Properti dan unit berhasil disimpan!')
      window.location.href = '/owner/properties'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Properti Baru</h1>
        <p className="text-muted-foreground">
          Lengkapi data properti dan kamar Anda
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            1
          </div>
          <span className={`text-sm font-medium ${step === 1 ? 'text-foreground' : 'text-muted-foreground'}`}>Data Gedung & Tags</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2">
          <div className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            2
          </div>
          <span className={`text-sm font-medium ${step === 2 ? 'text-foreground' : 'text-muted-foreground'}`}>Tambah Unit</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Informasi Properti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Properti</Label>
              <Input
                id="title"
                value={step1.title}
                onChange={(e) => updateStep1({ title: e.target.value })}
                placeholder="Contoh: Kost Melati"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipe</Label>
              <Select
                value={step1.type}
                onValueChange={(v) => updateStep1({ type: v as Step1Data['type'] })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Provinsi</Label>
              <Select
                value={step1.province || ''}
                onValueChange={(v) => updateStep1({ province: v || '', city: '' })}
              >
                <SelectTrigger id="province">
                  <SelectValue placeholder="Pilih Provinsi" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((prov) => (
                    <SelectItem key={prov} value={prov}>
                      {prov}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Kota/Kabupaten</Label>
              <Select
                value={step1.city || ''}
                onValueChange={(v) => updateStep1({ city: v || '' })}
                disabled={!step1.province}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder={step1.province ? 'Pilih Kota' : 'Pilih Provinsi dahulu'} />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat Detail</Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  value={step1.address}
                  onChange={(e) => updateStep1({ address: e.target.value })}
                  placeholder="Jl. Sudirman No. 123, RT 05/RW 10"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeolocation}
                  title="Gunakan lokasi saat ini"
                >
                  <HugeiconsIcon icon={Location02Icon} strokeWidth={2} className="size-4" />
                </Button>
              </div>
              {step1.latitude && step1.longitude && (
                <p className="text-xs text-muted-foreground">
                  Lokasi: {step1.latitude}, {step1.longitude}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Foto Properti (Minimal 3, Maksimal 5)</Label>
              <PropertyImagesUpload
                initialImages={step1.images}
                onImagesChange={(images) => updateStep1({ images })}
                minImages={3}
                maxImages={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Paket Harga</Label>
              <PackageForm
                type={step1.type as 'kost' | 'kontrakan'}
                onChange={(packs) => updateStep1({ packages: packs })}
              />
            </div>

            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="flex gap-2">
                <Input
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addAmenity(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  placeholder="Ketik dan tekan Enter"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {step1.amenities.map((a) => (
                  <Badge
                    key={a}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeAmenity(a)}
                  >
                    {a} ×
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {commonAmenities
                  .filter((c) => !step1.amenities.includes(c))
                  .map((c) => (
                    <Button
                      key={c}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addAmenity(c)}
                    >
                      + {c}
                    </Button>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={step1.description}
                onChange={(e) => updateStep1({ description: e.target.value })}
                placeholder="Deskripsi singkat properti..."
              />
            </div>

            <div className="space-y-3">
              <Label>Tags (Fasilitas & Aturan)</Label>
              {facilityTags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fasilitas</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {facilityTags.map((tag) => {
                      const checked = step1.selectedTagIds.includes(tag.id)
                      return (
                        <label
                          key={tag.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleTag(tag.id)}
                          />
                          <span className="truncate">{tag.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
              {ruleTags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aturan</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {ruleTags.map((tag) => {
                      const checked = step1.selectedTagIds.includes(tag.id)
                      return (
                        <label
                          key={tag.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleTag(tag.id)}
                          />
                          <span className="truncate">{tag.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
              {!tagsData && (
                <p className="text-xs text-muted-foreground">Memuat tags...</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                Lanjut ke Step 2
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Unit (Kamar)</CardTitle>
              <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
                <DialogTrigger render={<Button size="sm" />}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
                  Tambah Kamar/Unit
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingUnit ? 'Edit Unit' : 'Tambah Unit'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit-name">Nama Unit</Label>
                      <Input
                        id="unit-name"
                        value={unitForm.name}
                        onChange={(e) => setUnitForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Contoh: Kamar 01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit-price">Harga Sewa</Label>
                      <Input
                        id="unit-price"
                        type="number"
                        value={unitForm.price}
                        onChange={(e) => setUnitForm((f) => ({ ...f, price: e.target.value }))}
                        placeholder="Contoh: 1500000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit-status">Status</Label>
                      <Select
                        value={unitForm.status}
                        onValueChange={(v) => setUnitForm((f) => ({ ...f, status: v as Unit['status'] }))}
                      >
                        <SelectTrigger id="unit-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="booked">Booked</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit-description">Deskripsi</Label>
                      <Textarea
                        id="unit-description"
                        value={unitForm.description}
                        onChange={(e) => setUnitForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Deskripsi singkat unit..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Foto Unit (Opsional, maksimal 5)</Label>
                      <Dropzone
                        onFilesChange={(files) => {
                          setUnitFilesMap((prev) => ({ ...prev, [editingUnit?._tempId || 'new']: files }))
                        }}
                        maxFiles={5}
                        minFiles={0}
                        currentFiles={unitFilesMap[editingUnit?._tempId || 'new'] || []}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setUnitDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button onClick={saveUnit} disabled={!unitForm.name.trim() || !unitForm.price}>
                        {editingUnit ? 'Simpan' : 'Tambah'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {units.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada unit. Klik "Tambah Kamar/Unit" untuk menambah.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {units.map((unit) => (
                    <Card key={unit._tempId} size="sm">
                      <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                          <CardTitle className="text-sm">{unit.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            Rp {Number(unit.price).toLocaleString('id-ID')} / bulan
                          </p>
                        </div>
                        <Badge variant={unit.status === 'available' ? 'default' : unit.status === 'booked' ? 'secondary' : 'destructive'}>
                          {unit.status}
                        </Badge>
                      </CardHeader>
                      {unit.description && (
                        <CardContent>
                          <p className="text-xs text-muted-foreground line-clamp-2">{unit.description}</p>
                        </CardContent>
                      )}
                      <div className="flex items-center justify-end gap-2 px-(--card-spacing) pb-(--card-spacing)">
                        <Button variant="ghost" size="icon" onClick={() => openEditUnit(unit)}>
                          <HugeiconsIcon icon={PencilIcon} strokeWidth={2} className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeUnit(unit._tempId)}>
                          <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Kembali
            </Button>
            <Button onClick={handleSaveAll} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Semua'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
