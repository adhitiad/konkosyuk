# Panduan UI/UX & Design System KonkosYuk

## Skema Warna

| Nama | Warna | Penggunaan |
|------|-------|------------|
| Primary | `#0F172A` (Slate-900) | Header, teks utama |
| Accent/Gradient | `#38BDF8` (Sky-400) → `#6366F1` (Indigo-500) | Tombol, link, elemen interaktif |
| Background Utama | `#0B1120` (Dark Navy) / `#0B1220` | Latar belakang keseluruhan |
| Background Card | `#1E293B` (Slate-800) + `rgba(255, 255, 255, 0.05)` | Glassmorphism effect |
| Text Utama | `#F8FAFC` (Slate-50) | Teks utama |
| Text Sekunder | `#94A3B8` (Slate-400) | Teks sekunder |
| Sukses | `#10B981` (Emerald-500) | Status sukses |
| Peringatan | `#F59E0B` (Amber-500) | Status peringatan |
| Bahaya | `#EF4444` (Red-500) | Status bahaya |
| Border/Hover | `border-white/10` atau `border-sky-500/50` | Elemen aktif |

## Tipografi

**Heading**: Font `Inter`, weight 700–800, `tracking-tight` — contoh: `text-4xl font-extrabold tracking-tight text-slate-50`

**Body**: Font `Inter`, weight 400–500, `text-slate-300`, gunakan `line-clamp` untuk konten panjang.

**Angka/Data**: Gunakan `tabular-nums` agar angka rapi di tabel/statistik.

## Aturan Komponen

### Tombol (Button)
- `rounded-xl px-5 py-3`
- `bg-gradient-to-r from-sky-500 to-indigo-500`
- `shadow-lg shadow-sky-500/30`
- Hover: `opacity-90` dan `shadow-xl`
- Efek scale `1.05` dengan `transition-all duration-300`

### Card
- `rounded-2xl`
- `bg-white/5 backdrop-blur-xl border border-white/10`
- `p-6`
- Hover: `border-sky-500/50 shadow-2xl shadow-sky-500/20`

### Form Input
- `bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3`
- `text-slate-100 placeholder-slate-500`
- Fokus: `border-sky-500 ring-2 ring-sky-500/30`

### Kalender
- Highlight tanggal tersedia, disabled untuk tanggal penuh.

### Tabel
- Header kolom: `bg-white/5`
- Baris: `border-b border-white/5`, hover `bg-white/10`

### Badge Status

| Status | Kelas |
|--------|-------|
| Menunggu Pembayaran | `bg-amber-500/20 text-amber-300` |
| Aktif/Terkonfirmasi | `bg-emerald-500/20 text-emerald-300` |
| Selesai | `bg-sky-500/20 text-sky-300` |
| Dibatalkan | `bg-red-500/20 text-red-300` |

### Sidebar Admin
- `w-64 h-screen sticky top-0`
- `bg-slate-900/90 backdrop-blur-xl border-r border-white/10`
- Menu aktif: `bg-sky-500/20 text-sky-400 border-r-2 border-sky-500`

## Nuansa & Vibe

1. **Dark Mode Premium** — Latar gelap dengan aksen sky & indigo yang elegan.
2. **Glassmorphism** — Efek frosted-glass pada cards, navbar, sidebar.
3. **Clean & Spacious** — Banyak whitespace, tidak sesak.
4. **Micro-animations** — `transition-all duration-300 ease-in-out`; animasi `fade-in-up` saat pertama kali elemen muncul di viewport.
5. **Modern** — Ikon Lucide Icons, bentuk rounded, shadow mengambang.
