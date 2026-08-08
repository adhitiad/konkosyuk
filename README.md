# 🏠 KonkosYuk - Platform Booking Kost & Kontrakan

**Deskripsi Singkat:**
KonkosYuk adalah platform web modern yang menjembatani pencari hunian (Tenant) dengan pemilik properti (Owner). Dilengkapi dengan sistem pembayaran aman (DP 35%), verifikasi KYC ketat, dan dukungan multi-bahasa.

## ✨ Fitur Utama
- **Pencarian Cerdas:** Filter lokasi, harga, dan fasilitas dengan Peta Interaktif.
- 🛡️ **Keamanan Transaksi:** Sistem DP 35% & Pelunasan 65% via Doku, iPaymu, dan Nicepay.
- 🌍 **Multi-Bahasa:** Mendukung ID, EN, MY, TH, VI, KO, ZH, RU.
- 📸 **Smart Upload:** Kompresi gambar otomatis & Hybrid Cloud Storage (Uploadthing + Cloudinary).
- 🤖 **AI Assistant:** Chatbot rekomendasi properti berbasis OpenRouter.
- 👑 **Dashboard Owner & Admin:** Manajemen properti, KYC, dan Analitik Keuntungan.

## ️ Tech Stack
- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Database:** PostgreSQL, Drizzle ORM
- **Auth:** Better Auth (Email & Google OAuth)
- **Payment:** Doku, iPaymu, Nicepay
- **Media:** Cloudinary, Uploadthing, browser-image-compression

## 🚀 Cara Menjalankan di Lokal
1. Clone repository ini.
2. Install dependencies: `bun install` atau `npm install`.
3. Salin `.env.example` menjadi `.env` dan isi variabel environment yang diperlukan.
4. Jalankan database migration: `bunx drizzle-kit push`.
5. Start server: `bun dev`.

## 📸 Screenshots
*(Tambahkan screenshot halaman Landing Page, Dashboard Admin, dan Halaman Properti di sini nanti)*

## ‍💻 Author
Dibuat dengan ❤️ oleh **Adhitia Dwima** github @adhitiad