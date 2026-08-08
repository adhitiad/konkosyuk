'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global app error:', error)
  }, [error])

  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <div className="container flex min-h-screen items-center justify-center">
          <Alert variant="destructive" className="mb-6 max-w-md">
            <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
            <AlertTitle>Terjadi kesalahan sistem</AlertTitle>
            <AlertDescription>
              Aplikasi mengalami masalah. Silakan refresh halaman atau coba lagi nanti.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={reset}>
              Coba Lagi
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
