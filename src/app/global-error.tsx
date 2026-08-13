'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  void error

  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <div style={{ fontFamily: 'system-ui', maxWidth: 640, margin: '20vh auto', padding: 24 }}>
          <h1>Terjadi kesalahan sistem</h1>
          <p>Aplikasi mengalami masalah. Silakan refresh halaman atau coba lagi nanti.</p>
          <button onClick={reset}>Coba Lagi</button>{' '}
          <a href="/">Kembali ke Beranda</a>
        </div>
      </body>
    </html>
  )
}
