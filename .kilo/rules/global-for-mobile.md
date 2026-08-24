# Flutter Development Rules for KonkosYuk Mobile

## 1. Arsitektur & Struktur Folder (Feature-First)

- **Jangan** mengelompokkan berdasarkan tipe file (`/models`, `/views`, `/controllers`).
- **Lakukan** pengelompokan berdasarkan Fitur (Feature-First) agar skalabel.
- Struktur folder yang wajib:
  ```text
  lib/
  ├── core/          # Shared utilities, network (Dio), theme, constants
  ├── features/      # Fitur utama (auth, properties, bookings, reports)
  │   └── auth/
  │       ├── data/      # Models, API repositories
  │       ├── domain/    # Entities, use cases (opsional untuk MVP)
  │       └── presentation/ # UI (Screens, Widgets, State/Providers)
  └── main.dart
  ```

## 2. State Management (Pilihan: Riverpod)

- Karena developer terbiasa dengan React Query, gunakan Riverpod 2.0+ (bukan Provider lama atau BLoC yang terlalu boilerplate).
- Gunakan AsyncNotifierProvider untuk menangani data asinkron (mirip useQuery di React).
- State UI lokal (seperti isDropdownOpen) cukup gunakan StatefulWidget atau useState equivalent.

## 3. Networking & API

- Gunakan Dio sebagai HTTP client (mirip Axios di web).
- Buat satu instance Dio di lib/core/network/dio_client.dart dengan interceptor untuk menyuntikkan Token Auth secara otomatis.
- Base URL API harus diambil dari Environment Variables (.env), jangan di-hardcode.
- Handle error secara global di Interceptor (misal: jika 401, auto-logout).

## 4. UI & Theming

- Gunakan Material Design 3 sebagai basis, namun sesuaikan warna dan tipografi dengan brand KonkosYuk (Teal/Green).
- Responsive Design: Gunakan LayoutBuilder atau package flutter_screenutil agar UI rapi di HP dan Tablet.
- Hindari hardcode ukuran. Gunakan Theme.of(context).textTheme dan SizedBox untuk spacing.
- Semua teks yang tampil ke user HARUS mendukung i18n (Indonesia/Inggris) menggunakan package flutter_localizations dan intl.

## 5. Local Storage & Caching

- Gunakan Hive atau SharedPreferences hanya untuk menyimpan Token Auth dan Preferensi User (seperti bahasa).
- Untuk caching data properti/listing, manfaatkan fitur caching bawaan Riverpod.

## 6. Penanganan Gambar

- Gunakan CachedNetworkImage untuk semua gambar dari Cloudinary/Unsplash agar tidak download ulang saat scroll.
- Untuk upload gambar dari galeri/kamera, gunakan image_picker dan kirim via MultipartFile ke endpoint /api/upload yang sudah ada

# _Catatan Tambahan_

Jika untuk **Web** dan **Backend**, silakan lihat di `.kilo/rules/global-project-web-and-backend.md`. Dan untuk **Mobile**, silakan lihat di `.kilo/rules/global-for-mobile.md`.

Dan semua aturan ini berlaku untuk semua proyek yang Anda kerjakan, baik itu proyek pribadi maupun proyek klien. Pastikan untuk selalu mematuhi aturan ini agar kode yang dihasilkan berkualitas tinggi, aman, dan mudah dipelihara. dan mohonn untuk catat segala bentuk perubahan di `apps/web/CHANGELOG.md`
