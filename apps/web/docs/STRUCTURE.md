# Struktur Dokumentasi Internal

Rekomendasi struktur folder dokumentasi untuk memindahkan file internal dari root folder agar lebih rapi dan mudah dikelola.

## 📂 Struktur yang Disarankan

```
konkosyuk/
├── README.md                 # Dokumentasi utama (publik)
├── CONTRIBUTING.md           # Panduan kontribusi
├── CHANGELOG.md              # Riwayat perubahan
├── LICENSE                   # Lisensi MIT
├── SECURITY.md               # Security policy (publik)
│
├── docs/                     # Dokumentasi internal
│   ├── README.md             # Index dokumentasi internal
│   ├── api.md                # API documentation
│   ├── testing.md            # Testing guide
│   ├── architecture.md       # Arsitektur sistem
│   ├── product/              # Product documentation
│   │   ├── README.md
│   │   ├── product.md        # Product overview
│   │   ├── promotion.md      # Marketing/promotion content
│   │   └── roadmap.md        # Product roadmap
│   ├── security/             # Security documentation
│   │   ├── README.md
│   │   ├── SECURITY_AUDIT_REPORT.md
│   │   ├── SECURITY_AUDIT_ADMIN.md
│   │   └── SECURITY_FIXES.md
│   ├── deployment/           # Deployment guides
│   │   ├── README.md
│   │   ├── netlify.md
│   │   └── docker.md
│   └── adr/                  # Architecture Decision Records
│       ├── 001-auth-choice.md
│       ├── 002-payment-gateway.md
│       └── 003-database-choice.md
│
├── .github/                  # GitHub-specific
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── scripts/                  # Utility scripts
│   ├── encrypt-payment-gateway-configs.ts
│   ├── seed.ts
│   └── baseline-drizzle.ts
│
└── src/                      # Source code
```

## 📋 File yang Akan Dipindahkan

### Dari Root → `docs/product/`

- `product.md` → `docs/product/product.md`
- `promotion.md` → `docs/product/promotion.md`

### Dari Root → `docs/security/`

- `SECURITY_AUDIT_ADMIN.md` → `docs/security/SECURITY_AUDIT_ADMIN.md`
- `SECURITY_AUDIT_REPORT.md` → `docs/security/SECURITY_AUDIT_REPORT.md`
- `SECURITY_FIXES.md` → `docs/security/SECURITY_FIXES.md`
- `SECURITY.md` → `docs/security/SECURITY.md` (atau tetap di root sebagai publik)

### File Baru yang Akan Dibuat

- `docs/api.md` - API documentation
- `docs/testing.md` - Testing guide
- `docs/architecture.md` - System architecture
- `docs/deployment/` - Deployment guides
- `docs/adr/` - Architecture Decision Records

## 🚀 Migrasi Bertahap

### Tahap 1: Buat Struktur Baru

```bash
mkdir -p docs/product docs/security docs/deployment docs/adr
```

### Tahap 2: Pindahkan File

```bash
# Product docs
git mv product.md docs/product/product.md
git mv promotion.md docs/product/promotion.md

# Security docs
git mv SECURITY_AUDIT_ADMIN.md docs/security/SECURITY_AUDIT_ADMIN.md
git mv SECURITY_AUDIT_REPORT.md docs/security/SECURITY_AUDIT_REPORT.md
git mv SECURITY_FIXES.md docs/security/SECURITY_FIXES.md
```

### Tahap 3: Update Referensi

Update semua link internal yang merujuk ke file lama.

### Tahap 4: Buat Index

Buat `docs/README.md` sebagai index dokumentasi internal.

---

## 📝 Catatan

- File publik seperti `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, dan `SECURITY.md` tetap di root untuk visibility GitHub
- File internal seperti audit report dan product specs dipindah ke `docs/` untuk organisasi yang lebih baik
- Pertimbangkan untuk menambahkan `.nojekyll` file jika deploying ke GitHub Pages
