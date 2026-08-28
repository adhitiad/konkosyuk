# Aplikasi Mobile KonkosYuk

Aplikasi Flutter yang merupakan bagian dari monorepo Turborepo KonkosYuk. Aplikasi ini berfungsi sebagai client mobile untuk platform KonkosYuk, berkomunikasi dengan server backend melalui REST API.

## Arsitektur

Aplikasi mobile ini menggunakan arsitektur **Feature-First** dan berkomunikasi dengan backend melalui protokol **HTTP/REST**.

### Komunikasi REST API

- Aplikasi mobile memanggil layanan backend di `apps/web` melalui **REST API** (bukan gRPC).
- Base URL API diambil dari **Environment Variable** (`API_BASE_URL`), tidak di-hardcode.
- HTTP client (Dio) dikelola di `lib/core/network/` dengan interceptor untuk menyuntikkan token autentikasi secara otomatis pada setiap request.
- Upload file menggunakan `MultipartFile` ke endpoint `/api/upload`.

### State Management

Menggunakan **Riverpod 3.0+** untuk manajemen state. `AsyncNotifierProvider` digunakan untuk data asinkron (mirip useQuery di React Query), sedangkan state UI lokal cukup menggunakan `StatefulWidget` atau state yang disediakan oleh Riverpod.

### Autentikasi & Storage

- Token sesi disimpan melalui **flutter_secure_storage** (menggunakan Keychain di iOS dan Keystore di Android).
- Preferensi non-sensitif (bahasa, tema) disimpan di SharedPreferences.
- Error global (misalnya 401/Unauthenticated) ditangani di interceptor Dio, termasuk auto-logout.

## Prasyarat

Sebelum memulai, pastikan perangkat pengembangan memiliki:

- **Flutter SDK** (versi sesuai `environment.sdk` di `pubspec.yaml`, saat ini Dart ^3.13.0)
- **Bun** (package manager untuk manajemen monorepo, versi 1.4.0)

## Langkah Setup

### 1. Instal Dependensi

Jalankan perintah berikut di direktori `apps/mobile` untuk menginstal dependensi Flutter:

```bash
flutter pub get
```

### 2. Konfigurasi Environment

Salin file `.env.example` (jika tersedia) menjadi `.env` di direktori `apps/mobile`, atau konfigurasi environment variables sesuai kebutuhan:

- `API_BASE_URL` — base URL backend (default: `http://localhost:3000`)

Untuk build/run di perangkat fisik, sesuaikan `API_BASE_URL` dengan URL backend yang dapat diakses oleh perangkat.

### 3. Jalankan Aplikasi

Untuk menjalankan aplikasi di emulator atau device:

```bash
flutter run
```

Atau gunakan perintah berikut sesuai target device:

```bash
flutter run -d chrome        # Jalankan di Chrome (web)
flutter run -d emulator-5554 # Jalankan di emulator Android tertentu
flutter run                  # Pilih device yang tersedia
```

Untuk build release:

```bash
flutter build apk   # Build APK Android
flutter build ios   # Build iOS (memerlukan macOS + Xcode)
```

## Struktur Direktori

```
apps/mobile/
├── lib/
│   ├── core/
│   │   └── network/
│   │       └── dio_client.dart       # Konfigurasi HTTP client
│   ├── features/
│   │   └── auth/
│   │       ├── data/                 # Model, repository REST API client
│   │       ├── domain/              # Entities, use cases (opsional untuk MVP)
│   │       └── presentation/        # UI (Screens, Widgets, State/Providers)
│   └── main.dart                    # Entry point aplikasi
├── android/                         # Proyek native Android
├── ios/                             # Proyek native iOS
├── test/
│   └── widget_test.dart             # Test widget Flutter
├── pubspec.yaml                     # Dependensi dan konfigurasi Flutter
└── README.md                        # Dokumentasi ini
```

### Penjelasan

- **`lib/`**: Kode sumber utama aplikasi Flutter.
  - `core/`: Shared utilities, konfigurasi jaringan (HTTP/REST), theme, dan constants.
  - `features/`: Fitur-fitur utama diorganisir per modul (auth, properties, bookings, dll). Setiap fitur mengikuti pola `data/`, `domain/`, `presentation/`.
  - `main.dart`: Entry point aplikasi.
- **`android/`**: Proyek native Android, berisi build config, manifest, dan kode platform-specific.
- **`ios/`**: Proyek native iOS, berisi Xcode project dan build config.
- **`test/`**: Test suite menggunakan framework testing bawaan Flutter.

## Komunikasi dengan Backend

Aplikasi mobile tidak memiliki sender email/WhatsApp langsung. Semua operasi notifikasi dan komunikasi dengan backend dilakukan melalui:

1. **REST API** (`apps/web`) — utama untuk semua operasi data dan business logic.
2. **Dio** — digunakan untuk upload file (multipart ke endpoint `/api/upload`) dan semua panggilan API lainnya.

## Kontribusi

Pastikan untuk mematuhi aturan yang tercantum di `.kilo/rules/global-for-mobile.md` dan `.kilo/rules/global-project-web-and-backend.md`. Semua perubahan harus didokumentasikan di `CHANGELOG.md` (di root monorepo) dengan format yang telah ditetapkan.