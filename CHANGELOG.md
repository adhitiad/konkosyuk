# Ringkasan Perubahan

## Verifikasi
- **Lint**: 0 error, 17 warning (pre-existing, tidak ada error baru)
- **TypeScript**: 0 type error
- **TODO/FIXME**: 0
- **Tests**: 108 passed
- **Console.log debug**: 0 tertinggal

## Tabel Perubahan

| File | Perubahan | Alasan |
|------|-----------|--------|
| `packages/shared/src/db/schema.ts` | Pindahkan schema Drizzle dari `apps/web/src/db/schema.ts` ke shared package | PR-1: schema harus di-shared agar `apps/grpc` bisa akses tanpa app-to-app dependency |
| `packages/shared/src/db/index.ts` | Buat `createDb()` factory yang export schema dan tipe `Db` | Shared DB helper untuk web dan gRPC server |
| `apps/web/src/db/schema.ts` | Ganti menjadi re-export dari `@konkosyuk/shared/db/schema` | Jangan duplikat schema, tetap backward-compatible via path alias `@/db/schema` |
| `apps/web/src/db/index.ts` | Ganti menjadi panggil `createDb()` dari shared package | Gunakan shared DB factory |
| `apps/web/tsconfig.json` | Tambah path alias `@konkosyuk/shared/*` → `../../packages/shared/src/*` | Perbaiki resolusi subpath import dari shared package |
| `packages/shared/package.json` | Tambah `drizzle-orm`, `pg`, `@types/pg`, `@types/node` sebagai dependencies | Shared package butuh driver DB + types |
| `proto/konkosyuk/v1/common.proto` | Buat proto baru dengan `Empty`, `PaginationRequest/Response`, `ApiResponse` | Contract shared untuk semua service |
| `proto/konkosyuk/v1/auth.proto` | Buat proto AuthService (Register, Login, RefreshSession, GetMe, Logout) | Phase 0: contract auth gRPC |
| `proto/konkosyuk/v1/properties.proto` | Buat proto PropertyService (ListProperties, GetProperty) + messages `PropertyPackages`, `Property`, `Unit` | Phase 1: contract properties gRPC |
| `apps/grpc/package.json` | Buat package.json baru untuk gRPC server | Isolated service di Render |
| `apps/grpc/tsconfig.json` | Buat tsconfig baru | Typecheck gRPC server |
| `apps/grpc/Dockerfile.grpc` | Buat Dockerfile multi-stage untuk gRPC | Deploy ke Render Web Service |
| `apps/grpc/scripts/gen-proto.sh` + `buf.yaml` + `buf.gen.ts.yaml` | Setup proto generation dengan buf + ts-proto | Generate TS stubs dari proto |
| `apps/grpc/src/server.ts` | Buat gRPC server dengan AuthService + PropertyService | Phase 0: server siap di-port 50051 |
| `apps/grpc/src/lib/auth-instance.ts` | Buat instance Better Auth terpisah untuk gRPC (bearer plugin) | PR-2: auth gRPC tanpa mengubah web auth.ts |
| `apps/grpc/src/interceptors/auth.interceptor.ts` | Buat `requireAuth()` interceptor untuk extract Bearer token | Semua RPC kritis paksa auth |
| `apps/grpc/src/services/auth.service.ts` | Implementasi Register, Login, RefreshSession, GetMe, Logout | Phase 0: auth siap pakai |
| `apps/grpc/src/services/property.service.ts` | Implementasi stub ListProperties + GetProperty | Phase 1: port logic dari `apps/web/src/actions/properties.ts` |
| `apps/mobile/pubspec.yaml` | Tambah dependencies: `grpc`, `protobuf`, `flutter_secure_storage`, `flutter_riverpod`, `fixnum` | PR-3: mobile siap pakai gRPC |
| `apps/mobile/lib/core/network/grpc_channel.dart` | Buat `GrpcChannel` wrapper + Riverpod provider | Client utama untuk semua data call |
| `apps/mobile/lib/features/auth/data/auth_grpc_client.dart` | Buat `AuthGrpcClient` dengan `register`, `login`, `getMe`, `logout` + `FlutterSecureStorage` | Mobile auth via gRPC |
| `.kilo/rules/global-for-mobile.md` | Update §3 Networking & API: gRPC jadi utama, Dio fallback saja. Update §5: `flutter_secure_storage` wajib untuk token | Aturan mobile konsisten dengan arsitektur gRPC |
| `turbo.json` | Tambah task `proto:gen` dan tambah `^proto:gen` ke dependsOn `build` | Turbo pipeline regenerate proto sebelum build |
| `.gitignore` | Tambah `apps/grpc/gen/` dan `apps/mobile/lib/gen/` | Generated proto code tidak di-commit |
