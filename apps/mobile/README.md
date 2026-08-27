# Aplikasi Mobile KonkosYuk

Aplikasi Flutter yang merupakan bagian dari monorepo Turborepo KonkosYuk. Aplikasi ini berfungsi sebagai client mobile untuk platform KonkosYuk, berkomunikasi dengan server backend melalui gRPC.

## Arsitektur

Aplikasi mobile ini menggunakan arsitektur **Feature-First** dan berkomunikasi dengan backend melalui protokol **gRPC**.

### Komunikasi gRPC

- Aplikasi mobile memanggil layanan backend di `apps/grpc` melalui **gRPC** (bukan HTTP/REST langsung).
- Base URL gRPC diambil dari **Environment Variable** (`GRPC_HOST`), tidak di-hardcode.
- Koneksi gRPC dikelola di `lib/core/network/grpc_channel.dart` menggunakan `ClientChannel` dari package `grpc`.
- Interceptor dapat ditambahkan untuk menyuntikkan token autentikasi secara otomatis pada setiap request.
- Definisi layanan dan pesan gRPC berada di direktori `proto/konkosyuk/v1/*.proto` di root monorepo.
- Stub gRPC yang di-generate untuk aplikasi ini dapat ditambahkan sesuai kebutuhan.

### State Management

Menggunakan **Riverpod 3.0+** untuk manajemen state. `AsyncNotifierProvider` digunakan untuk data asinkron (mirip useQuery di React Query), sedangkan state UI lokal cukup menggunakan `StatefulWidget` atau state yang disediakan oleh Riverpod.

### Autentikasi & Storage

- Token sesi disimpan melalui **flutter_secure_storage** (menggunakan Keychain di iOS dan Keystore di Android).
- Preferensi non-sensitif (bahasa, tema) disimpan di SharedPreferences.
- Error global (misalnya 401/Unauthenticated) ditangani di interceptor gRPC, termasuk auto-logout.

## Prasyarat

Sebelum memulai, pastikan perangkat pengembangan memiliki:

- **Flutter SDK** (versi sesuai `environment.sdk` di `pubspec.yaml`, saat ini Dart ^3.13.0)
- **Bun** (package manager untuk manajemen monorepo, versi 1.4.0)
- **protoc** (Protocol Buffer Compiler) untuk men-generate stub gRPC

Pastikan juga `apps/grpc` sudah berjalan atau dapat dijalankan secara terpisah sebagai server gRPC.

## Langkah Setup

### 1. Instal Dependensi

Jalankan perintah berikut di direktori `apps/mobile` untuk menginstal dependensi Flutter:

```bash
flutter pub get
```

### 2. Generate Stub gRPC

Stub gRPC untuk aplikasi mobile di-generate dari direktori `proto/` di root monorepo. Jalankan perintah berikut dari **root monorepo**:

```bash
bun run proto:gen
```

Perintah ini akan menjalankan skrip `apps/grpc/scripts/gen-proto.sh` yang menggunakan `protoc` + `ts-proto` untuk menghasilkan stub TypeScript gRPC. Hasil generate disimpan di `apps/grpc/src/gen/**`.

> **Catatan**: Untuk aplikasi Flutter (Dart), stub tambahan dari `.proto` dapat di-generate menggunakan `protoc` dengan plugin `protoc-gen-dart` jika diperlukan.

### 3. Konfigurasi Environment

Salin file `.env.example` (jika tersedia) menjadi `.env` di direktori `apps/mobile`, atau konfigurasi environment variables sesuai kebutuhan:

- `GRPC_HOST` — host server gRPC (default: `localhost`)
- `GRPC_PORT` — port server gRPC (default: `50051`)

Untuk build/run di perangkat fisik, sesuaikan `GRPC_HOST` dengan IP address server yang dapat diakses oleh perangkat.

### 4. Jalankan Aplikasi

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
│   │       └── grpc_channel.dart    # Konfigurasi koneksi gRPC
│   ├── features/
│   │   └── auth/
│   │       ├── data/                # Model, repository gRPC client
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
  - `core/`: Shared utilities, konfigurasi jaringan (gRPC), theme, dan constants.
  - `features/`: Fitur-fitur utama diorganisir per modul (auth, properties, bookings, dll). Setiap fitur mengikuti pola `data/`, `domain/`, `presentation/`.
  - `main.dart`: Entry point aplikasi.
- **`android/`**: Proyek native Android, berisi build config, manifest, dan kode platform-specific.
- **`ios/`**: Proyek native iOS, berisi Xcode project dan build config.
- **`test/`**: Test suite menggunakan framework testing bawaan Flutter.

## Komunikasi dengan Backend

Aplikasi mobile tidak memiliki sender email/WhatsApp langsung. Semua operasi notifikasi dan komunikasi dengan backend dilakukan melalui:

1. **gRPC** (`apps/grpc`) — utama untuk semua operasi data dan business logic.
2. **Dio** — hanya digunakan untuk upload file (multipart ke endpoint `/api/upload`) dan endpoint yang belum dimigrasi selama transisi bertahap.

## Kontribusi

Pastikan untuk mematuhi aturan yang tercantum di `.kilo/rules/global-for-mobile.md` dan `.kilo/rules/global-project-web-and-backend.md`. Semua perubahan harus didokumentasikan di `CHANGELOG.md` (di root monorepo) dengan format yang telah ditetapkan.
