# 📦 KonkosYuk - Product Documentation

**Versi Dokumen:** 1.0.0  
**Status:** Active Development (MVP Phase)  
**Platform:** Web Application (Mobile Responsive)

---

## 1. Ringkasan Eksekutif (Executive Summary)

**KonkosYuk** adalah platform manajemen dan booking properti sewaan (Kost dan Kontrakan) berbasis web yang dirancang untuk menjembatani kesenjangan antara pemilik properti (Owner) dan penyewa (Tenant). Aplikasi ini mengotomatisasi proses pencarian, booking, pembayaran bertahap (DP 35%), hingga manajemen operasional harian seperti pelaporan kerusakan dan penilaian reputasi.

## 2. Visi & Misi Produk

- **Visi:** Menjadi platform sewa hunian paling terpercaya dan transparan di Asia Tenggara.
- **Misi:** Menghilangkan friksi dalam transaksi sewa-menyewa melalui teknologi, keamanan pembayaran, dan sistem reputasi dua arah.

## 3. Target Pengguna (User Personas)

1. **Tenant (Penyewa):** Mahasiswa, pekerja muda, atau keluarga yang mencari hunian sementara atau jangka panjang. Mengutamakan kemudahan, keamanan DP, dan transparansi harga.
2. **Owner (Pemilik):** Individu atau pengelola bisnis kost/kontrakan. Mengutamakan okupansi tinggi, pembayaran tepat waktu, dan manajemen tenant yang mudah.
3. **Admin/Staff (Platform):** Tim internal yang mengelola verifikasi properti, menyelesaikan sengketa, dan memonitor kesehatan sistem.

## 4. Fitur Inti (Core Features)

### 4.1. Modul Pencarian & Penemuan (Discovery)

- **Advanced Search Engine:** PostgreSQL Full-Text Search dengan dukungan bahasa Indonesia.
- **Geolocation & Maps:** Integrasi Leaflet & OpenStreetMap untuk pencarian berbasis radius dan peta interaktif.
- **Filter Dinamis:** Berdasarkan harga, tipe, fasilitas, dan jarak.

### 4.2. Modul Booking & Transaksi

- **Sistem Paket Dinamis:** Dukungan untuk sewa per jam, harian, bulanan, hingga tahunan dengan kalkulasi Diskon & PPN otomatis.
- **Hybrid Booking:**
  - _Instant Booking:_ Langsung terkunci jika unit tersedia.
  - _Request to Book:_ Mengunci unit untuk masa depan (Pre-order).
- **Skema Pembayaran Bertahap:** Wajib DP 35% untuk mengunci, pelunasan 65% sebelum check-in.
- **Multi-Gateway Payment:** Integrasi Doku, Sakuku, dan Nicepay dengan Webhook Signature Verification.

### 4.3. Modul Manajemen Properti (Owner Dashboard)

- **CRUD Properti & Unit:** Manajemen gedung dan kamar/unit secara hierarkis.
- **Approval Workflow:** Owner menyetujui/menolak permintaan booking request.
- **Maintenance Ticketing:** Sistem pelaporan dan tracking kerusakan dari tenant.

### 4.4. Modul Kepercayaan & AI (Trust & AI)

- **Tenant Scoring & Reviews:** Sistem rating dua arah (Tenant menilai Properti, Owner menilai Tenant).
- **AI Property Assistant:** Chatbot berbasis OpenRouter (Llama 3/Mistral) untuk rekomendasi properti dan FAQ.
- **Notifikasi Real-time:** In-app notification dan Web Push Notification.

## 5. Arsitektur Teknis (Tech Stack)

| Layer          | Teknologi                                  | Alasan Pemilihan                                                |
| :------------- | :----------------------------------------- | :-------------------------------------------------------------- |
| **Frontend**   | Next.js (App Router), React 18, TypeScript | Server-Side Rendering (SEO), Type-safety, Ekosistem luas.       |
| **Styling**    | Tailwind CSS, shadcn/ui                    | Konsistensi UI, Aksesibilitas, Dark/Light/Aurora mode.          |
| **State Mgmt** | TanStack Query, Zustand                    | Server-state caching & Client-state yang ringan.                |
| **Backend**    | Next.js Route Handlers, Zod                | API-less architecture, Validasi schema yang ketat.              |
| **Database**   | PostgreSQL, Drizzle ORM                    | Relasional yang kuat, Type-safe ORM, JSONB untuk fleksibilitas. |
| **Auth**       | Better Auth                                | Modern, aman, dukungan OAuth (Google), Session management.      |
| **AI/ML**      | OpenRouter API                             | Akses ke berbagai LLM open-source dengan satu API key.          |
| **Maps**       | Leaflet, OpenStreetMap                     | 100% Gratis, tanpa batasan API key komersial.                   |

## 6. Alur Bisnis Kritis (Critical Business Flows)

### 6.1. Alur Booking Instant

1. Tenant memilih Unit -> Checkout DP 35%.
2. Payment Gateway memproses -> Webhook sukses diterima.
3. Status Booking: `awaiting_full_payment`.
4. Tenant membayar pelunasan 65% -> Status: `confirmed`.
5. Unit ditandai `booked`.

### 6.2. Alur Booking Request (Pre-order)

1. Tenant memilih Unit (masa depan) -> Checkout DP 35%.
2. Webhook sukses -> Status: `awaiting_owner_approval`.
3. Owner mereview -> Approve -> Status: `awaiting_full_payment`.
4. Tenant membayar pelunasan -> Status: `confirmed`.

## 7. Keamanan & Kepatuhan (Security & Compliance)

- **Autentikasi:** Session-based dengan HttpOnly cookies (Better Auth).
- **Otorisasi:** Role-Based Access Control (RBAC) ketat di level API.
- **Keamanan Pembayaran:** Webhook signature verification (HMAC SHA256) untuk mencegah spoofing.
- **Data Privacy:** Password di-hash, data sensitif tidak terekspos di client.

## 8. Roadmap Pengembangan (Future Phases)

- **Phase 6:** Integrasi Tanda Tangan Digital (Digital Contract).
- **Phase 7:** Fitur Utility Tracker (Catat meteran listrik/air mandiri).
- **Phase 8:** Aplikasi Mobile Native (Flutter) untuk Tenant & Owner.
- **Phase 9:** Monetisasi (Biaya langganan Premium untuk Owner, Iklan properti unggulan).

---

_Dokumen ini dibuat oleh Adhitia Dwima & AI Assistant. Hak Cipta © 2026 KonkosYuk._
