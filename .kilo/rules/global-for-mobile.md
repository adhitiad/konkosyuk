# Flutter Development Rules for KonkosYuk Mobile

## 1. Arsitektur & Struktur Folder (Feature-First)

- **Jangan** mengelompokkan berdasarkan tipe file (`/models`, `/views`, `/controllers`).
- **Lakukan** pengelompokan berdasarkan Fitur (Feature-First) agar skalabel.
- Struktur folder yang wajib:
  ```text
  lib/
  ├── core/          # Shared utilities, network (gRPC), theme, constants
  ├── features/      # Fitur utama (auth, properties, bookings, reports)
  │   └── auth/
  │       ├── data/      # Models, API repositories (gRPC clients)
  │       ├── domain/    # Entities, use cases (opsional untuk MVP)
  │       └── presentation/ # UI (Screens, Widgets, State/Providers)
  └── main.dart
  ```

## 2. State Management (Pilihan: Riverpod)

- Karena developer terbiasa dengan React Query, gunakan Riverpod 2.0+ (bukan Provider lama atau BLoC yang terlalu boilerplate).
- Gunakan AsyncNotifierProvider untuk menangani data asinkron (mirip useQuery di React).
- State UI lokal (seperti isDropdownOpen) cukup gunakan StatefulWidget atau useState equivalent.

## 3. Networking & API

- gRPC channel (`grpc_channel.dart`) = client utama untuk semua data/business logic call.
- Buat satu instance gRPC channel di `lib/core/network/grpc_channel.dart` dengan interceptor untuk menyuntikkan Token Auth secara otomatis.
- Base URL gRPC harus diambil dari Environment Variables, jangan di-hardcode.
- Handle error secara global di interceptor (misal: jika 401/Unauthenticated, auto-logout).
- Dio tetap dipakai KHUSUS untuk: upload file (multipart ke `/api/upload` existing) dan endpoint yang belum sempat dimigrasi (fallback selama Phase 1-3 berjalan bertahap).

## 4. UI & Theming

- Gunakan Material Design 3 sebagai basis, namun sesuaikan warna dan tipografi dengan brand KonkosYuk (Teal/Green).
- Responsive Design: Gunakan LayoutBuilder atau package flutter_screenutil agar UI rapi di HP dan Tablet.
- Hindari hardcode ukuran. Gunakan Theme.of(context).textTheme dan SizedBox untuk spacing.
- Semua teks yang tampil ke user HARUS mendukung i18n (Indonesia/Inggris) menggunakan package flutter_localizations dan intl.

## 5. Local Storage & Caching

- Token sesi WAJIB disimpan lewat `flutter_secure_storage`, bukan SharedPreferences/Hive polos. Alasan: token gRPC adalah bearer token yang jika bocor memberikan akses penuh tanpa cookie HttpOnly protection seperti di web. SharedPreferences disimpan dalam plaintext di filesystem aplikasi, mudah di-extract dengan root/jailbreak. `flutter_secure_storage` menggunakan Keychain (iOS) dan Keystore (Android).
- Preferensi non-sensitif (bahasa/tema) tetap boleh SharedPreferences seperti aturan asli.
- Untuk caching data properti/listing, manfaatkan fitur caching bawaan Riverpod.

## 6. Penanganan Gambar

- Gunakan CachedNetworkImage untuk semua gambar dari Cloudinary/Unsplash agar tidak download ulang saat scroll.
- Untuk upload gambar dari galeri/kamera, gunakan image_picker dan kirim via MultipartFile ke endpoint /api/upload yang sudah ada

# _Catatan Tambahan_

Jika untuk **Web** dan **Backend**, silakan lihat di `.kilo/rules/global-project-web-and-backend.md`. Dan untuk **Mobile**, silakan lihat di `.kilo/rules/global-for-mobile.md`.

Dan semua aturan ini berlaku untuk semua proyek yang Anda kerjakan, baik itu proyek pribadi maupun proyek klien. Pastikan untuk selalu mematuhi aturan ini agar kode yang dihasilkan berkualitas tinggi, aman, dan mudah dipelihara. dan mohonn untuk catat segala bentuk perubahan di `CHANGELOG.md` pakai Tanggal `dd-MMM-yyyy hh:mm` (di root monorepo)
