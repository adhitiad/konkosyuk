# Aturan Pengembangan gRPC Service (Bun)

## 1. Konteks dan Peran

Ini adalah gRPC server standalone (Bun) yang power mobile app (`apps/mobile`).
Service ini mengekspor proto KonkosYuk v1 dan menggunakan Better Auth untuk
autentikasi via Bearer token. Di-deploy sebagai Web Service di Render pada port 50051.

## 2. Teknologi

- **Runtime & Package Manager**: Bun 1.4.0 (jangan pakai `npm`/`yarn`/`pnpm`)
- **Framework**: Bun + `@grpc/grpc-js` + `@grpc/proto-loader`
- **Proto**: `buf/protoc` source di `proto/konkosyuk/v1/*.proto`
- **Auth**: Better Auth dengan Drizzle adapter (`@better-auth/drizzle-adapter`)
- **Database**: PostgreSQL via Drizzle ORM (`@konkosyuk/shared/db`)
- **Logger**: Winston via `@konkosyuk/shared/lib/logger` (`logInfo`, `logError`, `logWarn`)
- **Testing**: Built-in Bun test runner

## 3. Arsitektur

### Struktur Folder

```text
src/
├── server.ts                           # Entry point — gRPC server bind + signal handler
├── interceptors/
│   └── auth.interceptor.ts             # requireAuth() — Bearer token validation
├── lib/
│   └── auth-instance.ts                # Better Auth instance (bearer plugin)
├── services/
│   ├── auth.service.ts                 # AuthService: Register, Login, RefreshSession, GetMe, Logout
│   ├── property.service.ts             # PropertyService: ListProperties, GetProperty
│   └── [future].service.ts             # Service baru sesuai proto
├── generated stubs di gen/ (jangan di-edit!)
```

### Proto Files

- SEMUA proto DIDEFINISIKAN di `proto/konkosyuk/v1/` — JANGAN edit di `src/gen/`
- `proto/konkosyuk/v1/konkosyuk.proto` adalah entry point yang import semua service proto
- `common.proto` berisi message shared: `Empty`, `PaginationRequest/Response`, `ApiResponse`
- Regenerasi stubs: `bun run proto:gen` dari **repo root** (bukan dari apps/grpc)

## 4. gRPC Service Pattern

### Service Handler

Setiap service handler di `src/services/` mengikuti pola ini:

```ts
export async function NamaMethod(
  call: ServerUnaryCall<RequestType, ResponseType>,
  callback: sendUnaryData<ResponseType>,
) {
  try {
    // 1. Validasi input (gunakan Zod schema atau manual check)
    // 2. Jika perlu auth, panggil requireAuth(call)
    // 3. Business logic
    // 4. callback(null, response)
  } catch (error) {
    // callback({ code: status.xxx, message: "..." })
  }
}
```

### gRPC Status Codes

Gunakan status code yang tepat dari `@grpc/grpc-js`:

| Error | Status Code |
|-------|-------------|
| Unauthorized / token invalid | `UNAUTHENTICATED` |
| Email sudah terdaftar | `ALREADY_EXISTS` |
| User tidak ditemukan | `NOT_FOUND` |
| Validasi gagal | `INVALID_ARGUMENT` |
| Server error | `INTERNAL` |
| Method tidak tersedia | `UNIMPLEMENTED` |

### Auth Interceptor

- `requireAuth(call)` di `interceptors/auth.interceptor.ts` mengekstrak Bearer token dari metadata
- Menerima token via `Authorization: Bearer <token>` di gRPC metadata
- Memvalidasi via `auth.api.getSession()` (Better Auth)
- Semua RPC yang membutuhkan auth wajib panggil `requireAuth(call)` di awal handler
- Handler yang tidak butuh auth (Register, Login) tidak perlu memanggil `requireAuth`

## 5. Better Auth

- Instance terpisah di `src/lib/auth-instance.ts` (tidak sama dengan web app)
- Konfigurasi: `emailAndPassword` (enabled, min 8 chars), `account.accountLinking`, `user.additionalFields`
- Session: `expiresIn: 7 hari`, `updateAge: 1 hari`
- Provider: Drizzle adapter dengan PostgreSQL
- Password hashing: `bcryptjs` (10 rounds)

## 6. Database

- Pakai `createDb()` dari `@konkosyuk/shared/db` (factory pattern)
- `DATABASE_URL` wajib di environment variables
- Pool config: `max: 5`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 10000`
- Schema re-export dari shared package — jangan definisikan schema lagi

## 7. TypeScript

- `tsconfig.json` memakai `rootDir: "../../"` (monorepo root) — jangan ganti ke `"./"`
- Path alias: `@konkosyuk/shared` → `../../packages/shared/src/index.ts`, `@konkosyuk/shared/*` → `../../packages/shared/src/*`
- HINDI import generated proto stubs secara langsung (`import type { ... } from "../gen/..."`) —
  hapus `import type` dan gunakan `satisfies any` jika perlu (generated stubs tidak tersedia di fresh checkout)
- Gunakan `as unknown as` untuk cast gRPC metadata, bukan `as` langsung
- Strict mode: aktif — semua variabel harus typed

## 8. Logging & Error Handling

- JANGAN pakai `console.log` / `console.error` — pakai `logInfo()`, `logError()`, `logWarn()` dari `@konkosyuk/shared/lib/logger`
- Logger otomatis mensanitize sensitive keys (password, token, apiKey, dll)
- Server shutdown: tangkap `SIGINT`, panggil `server.forceShutdown()`, log, exit

## 9. Environment Variables

| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| `DATABASE_URL` | Ya | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Ya | Min 32 chars |
| `PORT` | Opsional | Default `50051` |
| `NODE_ENV` | Ya | `production` di deploy |

## 10. Verification & Commands

```bash
cd apps/grpc
bun install          # install dependencies (dari repo root: bun install)
bun run dev          # development (bun --watch src/server.ts)
bun run start        # production (bun run dist/server.js)
bun run lint         # eslint src/
bun run typecheck    # tsc --noEmit
bun run proto:gen    # generate proto stubs (jika dijalankan dari apps/grpc)
```

Dari repo root:
```bash
bun run proto:gen    # regenerate gRPC stubs
```

## 11. Deploy

- Deploy ke Render sebagai **Web Service**
- Build: `bun build src/server.ts --outdir ./dist --target bun`
- Dockerfile: `Dockerfile.grpc` (multi-stage dengan oven/bun:1.4.0-alpine)
- Port: 50051
- WAJIB `DATABASE_URL` dan `BETTER_AUTH_SECRET` di environment

## 12. Catatan Tambahan

- Semua perubahan wajib dicatat di `CHANGELOG.md` (di root monorepo)
- Gunakan `z.unknown()` bukan `z.any()` untuk schema validation
- Ekstrak magic numbers ke named constants
- JANGAN gunakan `console.*` di production — selalu pakai shared logger
