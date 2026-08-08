'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { showToastSuccess, showToastError } from '@/lib/use-toast-custom'

export function KYCUploadForm({ onSuccess }: { onSuccess?: () => void }) {
  const [ktpNumber, setKtpNumber] = useState('')
  const [ktpImageUrl, setKtpImageUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/owner/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ktpNumber, ktpImageUrl }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengirim KYC')
        showToastError('Gagal mengunggah dokumen. Coba lagi.')
        return
      }

      setKtpNumber('')
      setKtpImageUrl('')
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
        <Label htmlFor="ktpImageUrl">URL Foto KTP</Label>
        <Input
          id="ktpImageUrl"
          value={ktpImageUrl}
          onChange={(e) => setKtpImageUrl(e.target.value)}
          placeholder="https://example.com/ktp.jpg"
          required
          type="url"
        />
        <p className="text-xs text-muted-foreground">
          Unggah foto KTP ke layanan penyimpanan (misal: Cloudinary, S3) dan masukkan URL-nya di sini.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Mengirim...' : 'Kirim untuk Verifikasi'}
      </Button>
    </form>
  )
}
