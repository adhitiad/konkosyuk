# Kontribusi ke KonkosYuk

Terima kasih telah tertarik berkontribusi pada KonkosYuk! Pedoman ini menjelaskan proses kontribusi agar kolaborasi berjalan lancar.

## 📋 Isi

- [Kode Etik](#kode-etik)
- [Cara Berkontribusi](#cara-berkontribusi)
- [Commit Convention](#commit-convention)
- [Pull Request Template](#pull-request-template)
- [Melaporkan Bug](#melaporkan-bug)
- [Mengusulkan Fitur](#mengusulkan-fitur)
- [Style Guide](#style-guide)

## 📜 Kode Etik

Dengan berkontribusi, Anda setuju untuk:

- Menghormati semua kontributor tanpa diskriminasi
- Menerima masukan konstruktif dengan lapang dada
- Fokus pada yang terbaik untuk proyek
- Menunjukkan empati terhadap anggota komunitas lain

## 🔄 Cara Berkontribusi

### 1. Fork Repository

Klik tombol **Fork** di pojok kanan atas halaman repository ini.

### 2. Clone Repository

```bash
git clone https://github.com/adhitiad/konkosyuk.git
cd konkosyuk
```

### 3. Tambahkan Upstream Remote

```bash
git remote add upstream https://github.com/adhitiad/konkosyuk.git
```

### 4. Buat Branch Baru

```bash
git checkout -b feat/nama-fitur
# atau
git checkout -b fix/nama-bug
```

### 5. Lakukan Perubahan

- Ikuti [Style Guide](#style-guide)
- Tambahkan test untuk perubahan baru
- Pastikan semua test passing: `bun run test -- --run`
- Pastikan type check passing: `bun x tsc --noEmit`

### 6. Commit Perubahan

```bash
git add .
git commit -m "feat: tambah filter properti berdasarkan harga"
```

### 7. Push ke Repository Anda

```bash
git push origin feat/nama-fitur
```

### 8. Buat Pull Request

Buka repository original di GitHub, klik **Compare & pull request**, isi template PR, dan submit.

---

## 📝 Commit Convention

Kami menggunakan [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

### Type

| Type       | Deskripsi                                                 |
| ---------- | --------------------------------------------------------- |
| `feat`     | Fitur baru                                                |
| `fix`      | Bug fix                                                   |
| `docs`     | Perubahan dokumentasi                                     |
| `style`    | Formatting, missing semicolons, dll (tidak mengubah kode) |
| `refactor` | Refactoring kode (tidak menambah fitur atau fix bug)      |
| `perf`     | Perbaikan performance                                     |
| `test`     | Menambah atau memperbaiki test                            |
| `chore`    | Perubahan build process, tools, libraries                 |
| `ci`       | Perubahan CI/CD                                           |
| `revert`   | Revert commit sebelumnya                                  |

### Scope (Opsional)

| Scope        | Contoh                                         |
| ------------ | ---------------------------------------------- |
| `app`        | `feat(app): tambah halaman About`              |
| `api`        | `fix(api): perbaiki validasi booking`          |
| `components` | `feat(components): tambah komponen DatePicker` |
| `lib`        | `refactor(lib): optimasi query properti`       |
| `db`         | `chore(db): update schema payments`            |
| `test`       | `test: tambah unit test untuk calculator`      |

### Subject

- Gunakan bahasa Indonesia atau Inggris
- Huruf kecil
- Tanpa titik di akhir
- Maksimal 50 karakter

### Body (Opsional)

- Jelaskan **mengapa** perubahan dibuat, bukan **apa** yang diubah
- Pisahkan dengan baris kosong dari subject

### Footer (Opsional)

- Reference issue: `Closes #123`
- Breaking change: `BREAKING CHANGE: ...`

### Contoh Commit

```bash
# Fitur baru
feat(api): tambah endpoint export booking ke CSV

# Bug fix
fix(components): perbaiki scroll pada modal pembayaran

# Dokumentasi
docs: update README dengan instruksi instalasi

# Refactoring
refactor(lib): ekstrak logika perhitungan DP ke utility

# Test
test: tambah test untuk signature verification
```

---

## 🔀 Pull Request Template

```markdown
## Deskripsi

Jelaskan perubahan yang dilakukan dan mengapa perubahan tersebut dibutuhkan.

## Tipe Perubahan

- [ ] Bug fix
- [ ] Fitur baru
- [ ] Breaking change
- [ ] Perubahan dokumentasi

## Checklist

- [ ] Kode mengikuti style guide proyek
- [ ] Self-review performed
- [ ] Komentar diberikan untuk kode yang sulit dipahami
- [ ] Dokumentasi diperbarui (jika diperlukan)
- [ ] Test ditambahkan untuk perubahan baru
- [ ] Semua test passing (`bun run test -- --run`)
- [ ] Type check passing (`bun x tsc --noEmit`)
- [ ] Tidak ada perubahan yang tidak perlu

## Screenshots (jika applicable)

Tambahkan screenshot untuk perubahan UI.

## Issue Terkait

Closes #(issue number)
```

---

## 🐛 Melaporkar Bug

### Sebelum Melapor

1. Cek apakah bug sudah dilaporkan di [Issues](https://github.com/adhitiad/konkosyuk/issues)
2. Kumpulkan informasi yang relevan

### Template Bug Report

```markdown
## Deskripsi Bug

Jelaskan bug secara singkat dan jelas.

## Langkah Reproduksi

1.  Pergi ke '...'
2.  Klik pada '....'
3.  Scroll ke '....'
4.  Lihat error

## Expected Behavior

Jelaskan apa yang seharusnya terjadi.

## Screenshots

Tambahkan screenshot jika applicable.

## Environment

- OS: [e.g. Windows 11, macOS Sonoma]
- Browser: [e.g. Chrome 120, Firefox 121]
- Node.js: [e.g. 20.10.0]
- Bun: [e.g. 1.4.0]

## Additional Context

Tambahkan konteks lain yang relevan.
```

---

## 💡 Mengusulkan Fitur

### Sebelum Mengusulkan

1. Cek apakah fitur sudah diusulkan di [Issues](https://github.com/adhitiad/konkosyuk/issues)
2. Pastikan fitur sesuai dengan visi proyek

### Template Feature Request

```markdown
## Masalah yang Diselesaikan

Jelaskan masalah yang dihadapi oleh pengguna.

## Solusi yang Diusulkan

Jelaskan fitur yang ingin ditambahkan.

## Alternatif yang Diperhitungkan

Jelaskan solusi alternatif lain yang sudah dipertimbangkan.

## Referensi (opsional)

Tambahkan referensi atau screenshot.
```

---

## 🎨 Style Guide

### TypeScript

- Gunakan TypeScript strict mode
- Hindari `any` - gunakan `unknown` atau buat type yang tepat
- Gunakan `interface` untuk objek, `type` untuk union/generic
- Export type yang reusable

### React / Next.js

- Server Components by default
- Hanya gunakan `"use client"` jika perlu state/effects/event handlers
- Gunakan Server Actions untuk mutasi data
- Komponen funcional dengan hooks bawaan

### Styling

- Gunakan Tailwind CSS utility classes
- Komponen UI dari `src/components/ui/`
- Gunakan `class-variance-authority` untuk variant
- Warna: gunakan CSS variables dari `src/app/globals.css`

### Naming Convention

- **File**: `kebab-case.ts` untuk utility, `PascalCase.tsx` untuk komponen
- **Function**: `camelCase()`
- **Variable**: `camelCase`
- **Constant**: `UPPER_SNAKE_CASE`
- **Type/Interface**: `PascalCase`
- **Component**: `PascalCase`

### Database

- Gunakan Drizzle ORM
- Tabel: `snake_case` plural
- Kolom: `snake_case`
- Index: `{table}_{column}_idx`
- Foreign key: `{table}_{column}_fk`

### Error Handling

- Gunakan `try/catch` di Server Actions dan API Routes
- Log error dengan `logError()` dari `src/lib/logger.ts`
- Return response yang user-friendly

---

## ❓ Butuh Bantuan?

Jika Anda membutuhkan bantuan saat berkontribusi:

1. Buka [Discussions](https://github.com/adhitiad/konkosyuk/discussions)
2. Atau hubungi maintainer di [GitHub](https://github.com/adhitiad)
