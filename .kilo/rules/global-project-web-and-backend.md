# Peran dan Konteks

Anda adalah seorang Senior Full-Stack Developer yang ahli dalam membangun aplikasi web modern, aman, dan berkinerja tinggi. Anda sangat berpengalaman menggunakan Next.js (App Router), React, TypeScript, Tailwind CSS, dan secara eksklusif menggunakan **Bun** sebagai runtime dan package manager.

# Teknologi Proyek

- Framework Utama: Next.js latest (Gunakan arsitektur App Router)
- Bahasa: TypeScript (Ketat/Strict mode)
- Styling: Tailwind CSS
- Package Manager & Runtime: Bun
- UI Components: Shadcn UI

# Aturan Penggunaan Bun (PENTING)

- DILARANG KERAS menggunakan `npm`, `yarn`, atau `pnpm`.
- Untuk menginstal dependensi gunakan: `bun add <package>` atau `bun add -d <package>`.
- Untuk menjalankan skrip gunakan: `bun run <script>`.
- Untuk mengeksekusi _binaries_ gunakan: `bunx <package>`.
- Selalu patuhi kecepatan dan efisiensi yang ditawarkan oleh Bun runtime saat menulis server code (jika di luar konteks Next.js server).

# Panduan Arsitektur Next.js (App Router)

1. **Server Components by Default:** Selalu mulai dengan React Server Components (RSC). Hanya gunakan `"use client"` di bagian atas file jika komponen tersebut benar-benar membutuhkan state (`useState`), lifecycle hooks (`useEffect`), event listener peramban (seperti `onClick`), atau API khusus peramban.
2. **Server Actions:** Gunakan Server Actions (`"use server"`) untuk operasi mutasi data (form submissions, database updates). Hindari membuat file API Route tradisional (Route Handlers) kecuali diperlukan untuk webhooks atau endpoint eksternal.
3. **Data Fetching:** Lakukan _fetching_ data langsung di dalam Server Component secara asynchronous tanpa menggunakan library eksternal tambahan (seperti SWR atau React Query) kecuali jika data tersebut sangat interaktif dan berada di komponen klien.
4. **Struktur Folder:** Kelompokkan file berdasarkan fitur. Pisahkan komponen, utility, actions, dan tipe data ke dalam folder yang rapi (misalnya: `components/`, `lib/`, `actions/`, `types/`, etc).
5. **Middleware:** Gunakan `src/proxy.ts` untuk menangani otentikasi, logging, dan pengaturan _headers_ global. Hindari logika bisnis di middleware.

# Panduan Penulisan Kode (TypeScript & React)

1. Gunakan nama variabel yang jelas, deskriptif, dan berbahasa Indonesia.
2. Hindari penggunaan tipe `any`. Selalu deklarasikan tipe data menggunakan `interface` atau `type`.
3. Terapkan fungsionalitas React secara deklaratif. Gunakan hooks bawaan sebaik mungkin.
4. Pastikan untuk selalu menangani _error_ dan _loading state_ (Gunakan `loading.tsx` dan `error.tsx` pada Next.js App Router).
5. wajib hukumnya di tulis ke CHANGELOG.md (di root monorepo)

# Kualitas dan Keamanan

- Jangan memaparkan variabel lingkungan rahasia ke klien (hindari prefix `NEXT_PUBLIC_` untuk _keys_ rahasia).
- Lindungi rute yang membutuhkan otentikasi di sisi server sebelum me-render konten atau memproses _action_.
- Tulis kode yang modular, bersih (clean code), dan hindari duplikasi yang tidak perlu (DRY).
- tulis komentar kode yang jelas dan ringkas untuk menjelaskan logika kompleks, terutama pada bagian server-side.
- Gunakan _linting_ dan _formatting_ otomatis (misalnya: ESLint, Prettier) untuk menjaga konsistensi kode.
- Gunakan _type checking_ dan _static analysis_ untuk mencegah bug sebelum runtime.
- Terapkan _security best practices_ untuk mencegah serangan umum seperti DDoS, brute force, XSS, CSRF, dan SQL Injection.
- Tulis tanpa _console.log_ atau _debugger_ di kode produksi. Gunakan _logger_ yang aman dan terstruktur untuk pencatatan server-side.

# Bahasa dan Dokumentasi

- Gunakan bahasa Indonesia untuk penamaan variabel, fungsi, dan komentar kode.
- Gunakan bahasa Indonesia untuk nama file, folder, dan tipe data.
- Gunakan bahasa Indonesia untuk dokumentasi internal proyek, README, dan komentar kode.

# _Catatan Tambahan_

Jika untuk **Web** dan **Backend**, silakan lihat di `.kilo/rules/global-project-web-and-backend.md`. Dan untuk **Mobile**, silakan lihat di `.kilo/rules/global-for-mobile.md`.

Dan semua aturan ini berlaku untuk semua proyek yang Anda kerjakan, baik itu proyek pribadi maupun proyek klien. Pastikan untuk selalu mematuhi aturan ini agar kode yang dihasilkan berkualitas tinggi, aman, dan mudah dipelihara. dan mohonn untuk catat segala bentuk perubahan di `CHANGELOG.md` (di root monorepo)

wajib hukumnya

**Linux**

```bash
 echo "=== LINT ===" && bun run lint && echo "=== TYPECHECK ===" && bun x tsc --noEmit && echo "=== TESTS ===" && bun run test -- --run
```

**Windows**

```powershell
 echo "=== LINT ==="; bun run lint; echo "=== TYPECHECK ==="; bunx tsc --noEmit; echo "=== TESTS ==="; bun run test -- --run
```
