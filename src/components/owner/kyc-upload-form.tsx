'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera01Icon, Delete01Icon, Upload01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { showToastSuccess, showToastError } from '@/lib/use-toast-custom'
import { apiClient } from '@/lib/axios'

export function KYCUploadForm({ onSuccess }: { onSuccess?: () => void }) {
  const [ktpNumber, setKtpNumber] = useState('')
  const [ktpImageUrl, setKtpImageUrl] = useState('')
  const [ktpFile, setKtpFile] = useState<File | null>(null)
  const [ktpPreview, setKtpPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar')
      return
    }

    setKtpFile(file)
    setKtpPreview(URL.createObjectURL(file))
    setError(null)

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'ktp')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Gagal mengunggah gambar')
      }

      const data = await res.json()
      setKtpImageUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah gambar')
      setKtpFile(null)
      setKtpPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setKtpFile(null)
    setKtpPreview(null)
    setKtpImageUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!ktpImageUrl) {
        setError('Upload foto KTP terlebih dahulu')
        setLoading(false)
        return
      }

      const res = await apiClient.post('/api/owner/kyc/submit', { ktpNumber, ktpImageUrl })

      const data = res.data

      if (res.status >= 400) {
        setError(data.error || 'Gagal mengirim KYC')
        showToastError('Gagal mengunggah dokumen. Coba lagi.')
        return
      }

      setKtpNumber('')
      setKtpImageUrl('')
      setKtpFile(null)
      setKtpPreview(null)
      showToastSuccess('Dokumen KYC terkirim! Admin akan memverifikasi dalam 5-25 menit.')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      showToastError('Gagal mengunggah dokumen. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert>
        <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-4" />
        <AlertDescription>
          Verifikasi akan diproses oleh Admin dalam waktu 5 - 25 menit pada jam kerja.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="ktpNumber">NIK KTP (16 digit)</Label>
        <Input
          id="ktpNumber"
          value={ktpNumber}
          onChange={(e) => setKtpNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
          placeholder="Contoh: 3201010101010001"
          required
          maxLength={16}
        />
      </div>

      <div className="space-y-2">
        <Label>Foto KTP</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {!ktpPreview ? (
          <Button
            type="button"
            variant="outline"
            className="w-full h-32 flex flex-col items-center justify-center gap-2 border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm">Mengunggah...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-6" />
                <span className="text-sm font-medium">Ambil Foto KTP</span>
                <span className="text-xs text-muted-foreground">Klik untuk buka kamera atau pilih file</span>
              </>
            )}
          </Button>
        ) : (
          <div className="relative rounded-lg border p-2">
            <img
              src={ktpPreview}
              alt="Preview KTP"
              className="w-full h-48 object-contain rounded-md"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8"
              onClick={removeFile}
            >
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading || !ktpImageUrl}>
        {loading ? 'Mengirim...' : 'Kirim untuk Verifikasi'}
      </Button>
    </form>
  )
}
