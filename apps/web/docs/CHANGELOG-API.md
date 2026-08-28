# API Changelog

Template dan contoh untuk mencatat perubahan API KonkosYuk.

## Format

Setiap perubahan API harus dicatat dengan format berikut:

```markdown
## [Versi] - Tanggal

### Added
- Endpoint baru dengan deskripsi

### Changed
- Perubahan pada endpoint yang ada

### Deprecated
- Endpoint yang akan dihapus

### Removed
- Endpoint yang sudah dihapus
```

## Contoh Entri

### v1.0.0 - 28-Aug-2026

#### Added
- Initial API specification
- Authentication endpoints (`/api/auth/*`)
- Notifications endpoints (`/api/notifications/*`, `/api/notifications/preferences`)
- User profile endpoints (`/api/user/profile`, `/api/users/me`)
- Ably token endpoint (`/api/ably/auth`)

#### Changed
- N/A

#### Deprecated
- N/A

#### Removed
- N/A

---

## Catatan Penting

1. **Breaking Changes**: Jika ada breaking change, tambahkan label `[BREAKING]` di judul
2. **Versioning**: Gunakan semantic versioning (MAJOR.MINOR.PATCH)
3. **Migration Guide**: Untuk breaking changes, sertakan migration guide
4. **Flutter Team**: Pastikan tim Flutter mendapat notifikasi sebelum perubahan di-deploy
