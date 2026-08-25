# Idempotency Guard — Hasil Implementasi

## cleanup-bookings.ts

- Status: DIPERBAIKI
- Pola: filter by status (pending_dp) + UPDATE safeguard
- Detail:
  - SELECT dan UPDATE sama-sama filter `bookings.status = "pending_dp"`
  - Booking yang sudah cancelled tidak akan diproses ulang
  - Ditambahkan komentar `F-2 fix` yang menjelaskan idempotency by status filter

## complete-bookings.ts

- Status: DIPERBAIKI
- Pola: filter by status + cek inspection existing
- Detail:
  - SELECT dan UPDATE sama-sama filter `bookings.status = "confirmed"`
  - Sebelum INSERT inspection, melakukan SELECT untuk cek apakah inspection untuk `bookingId` tersebut sudah ada
  - Jika sudah ada, skip dan tidak increment `inspectionCreatedCount`
  - Ditambahkan komentar `F-2 fix` pada pengecekan inspection

## saved-search-matcher.ts

- Status: DIPERBAIKI
- Pola: Redis key dengan TTL 24 jam
- Detail:
  - Tidak ada tabel `notification_log` di skema, jadi menggunakan Opsi B (Redis key)
  - Sebelum kirim notifikasi, cek Redis key `saved-search:notified:{userId}:{searchId}`
  - Jika key sudah ada, skip notifikasi
  - Jika belum ada, kirim notifikasi lalu set key dengan TTL 86400 detik (24 jam)
  - Import `getRedis` dari `@/lib/redis`
  - Ditambahkan komentar `F-2 fix`

## update-area-counts.ts

- Status: SUDAH IDEMPOTENT
- Pola: SET from count query (bukan increment)
- Detail:
  - Job menghitung ulang jumlah listing per area dari query COUNT(*) langsung
  - Melakukan UPDATE SET (bukan increment), jadi hasil akhir selalu konsisten
  - Ditambahkan komentar `F-2 note` yang menjelaskan idempotent by design
