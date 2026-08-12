'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BANKS, E_WALLETS } from '@/lib/constants/indonesian-payments'
import { addBankAccountSchema } from '@/lib/zod'
import type { AddBankAccountInput } from '@/lib/zod'
import { showToastSuccess, showToastError, showToastWarning } from '@/lib/use-toast-custom'
import { Spinner } from '@/components/ui/spinner'
import { apiClient } from '@/lib/axios'

const PROVIDERS = [
  { value: 'bank', label: 'Bank', options: BANKS },
  { value: 'ewallet', label: 'E-Wallet', options: E_WALLETS },
]

export function KYCBankForm({
  userName,
  onSuccess,
}: {
  userName: string
  onSuccess?: () => void
}) {
  const [accountType, setAccountType] = useState<'bank' | 'ewallet'>('bank')
  const [providerName, setProviderName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const availableProviders = PROVIDERS.find((p) => p.value === accountType)?.options ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setErrorCode(null)
    setLoading(true)

    try {
      const payload: AddBankAccountInput = {
        account_type: accountType,
        provider_name: providerName,
        account_number: accountNumber,
        account_name: accountName,
      }

      const validated = addBankAccountSchema.parse(payload)

      try {
        const res = await apiClient.post('/api/owner/bank-accounts', validated)

        showToastSuccess('Rekening berhasil ditambahkan! Nama sesuai dengan profil Anda.')
        setAccountType('bank')
        setProviderName('')
        setAccountNumber('')
        setAccountName('')
        onSuccess?.()
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { error?: string; code?: string } } }
        const data = axiosError?.response?.data ?? {}
        const errorMessage = data.error || 'Gagal menambahkan rekening'
        const errorCode = data.code || null

        if (errorCode === 'NAME_MISMATCH') {
          showToastError('Nama rekening tidak cocok. Silakan perbarui nama profil terlebih dahulu.')
        } else {
          showToastError(errorMessage)
        }
        setError(errorMessage)
        setErrorCode(errorCode)
      }
    } catch (err) {
      showToastWarning('Mohon lengkapi semua field dengan benar.')
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="account_type">Tipe Akun</Label>
        <Select value={accountType} onValueChange={(value) => setAccountType(value as 'bank' | 'ewallet')}>
          <SelectTrigger id="account_type">
            <SelectValue placeholder="Pilih tipe akun" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDERS.map((provider) => (
              <SelectItem key={provider.value} value={provider.value}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider_name">Provider</Label>
        <Select<string> value={providerName} onValueChange={(v) => v && setProviderName(v)}>
          <SelectTrigger id="provider_name">
            <SelectValue placeholder="Pilih provider" />
          </SelectTrigger>
          <SelectContent>
            {availableProviders.map((provider) => (
              <SelectItem key={provider} value={provider}>
                {provider}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_number">Nomor Rekening / E-Wallet</Label>
        <Input
          id="account_number"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Masukkan nomor rekening"
          required
          minLength={5}
          maxLength={30}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_name">Nama Sesuai Rekening</Label>
        <Input
          id="account_name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="Masukkan nama sesuai KTP/Buku Tabungan"
          required
          minLength={3}
          maxLength={100}
        />
        <Alert>
          <AlertDescription className="text-xs">
            Nama harus sama persis dengan nama profil Anda:{' '}
            <span className="font-semibold">{userName}</span>. Jika berbeda,
            transaksi akan ditolak.
          </AlertDescription>
        </Alert>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            {errorCode === 'NAME_MISMATCH' && (
              <div className="mt-2">
              <Button variant="link" className="h-auto p-0 text-destructive underline" nativeButton={false} render={
                <Link href="/dashboard/profile">Perbarui Nama Profil Saya</Link>
              } />
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
        {loading ? 'Menyimpan...' : 'Tambah Rekening'}
      </Button>
    </form>
  )
}
