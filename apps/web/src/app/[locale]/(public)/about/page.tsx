import { StaticPageLayout } from "@/components/static-page-layout";

export default function AboutPage() {
  return (
    <StaticPageLayout title="Tentang KonkosYuk">
      <p>
        KonkosYuk adalah platform digital yang menghubungkan pencari kost &
        kontrakan dengan pemilik properti terpercaya di seluruh Indonesia. Kami
        percaya bahwa mencari hunian tidak harus penuh drama, dan meminjamkan
        properti bisa dilakukan dengan aman serta transparan.
      </p>

      <h2>Misi Kami</h2>
      <ul>
        <li>
          <strong>Menghapus penipuan DP</strong> — Sistem keamanan yang
          memastikan dana Anda diproses dan dilindungi sampai booking
          terverifikasi.
        </li>
        <li>
          <strong>Transparansi harga</strong> — Tidak ada biaya tersembunyi.
          Semua paket harga, aturan pembayaran, dan ketentuan ditampilkan secara
          jelas sebelum Anda melakukan booking.
        </li>
        <li>
          <strong>Memudahkan Owner</strong> — Alat manajemen properti yang
          sederhana sehingga owner bisa fokus menyiapkan hunian, bukan ribet
          mengelola administrasi.
        </li>
      </ul>

      <h2>Mengapa KonkosYuk?</h2>
      <p>
        KonkosYuk hadir dengan dua fitur utama yang membedakan kami dari
        platform lain:
      </p>
      <ul>
        <li>
          <strong>Sistem DP 35%</strong> — Hanya cukup bayar 35% untuk menjamin
          booking, dan pelunasan 65% dilakukan sebelum check-in. Model ini
          mengurangi risiko bagi tenant sekaligus menjaga komitmen pemilik
          properti.
        </li>
        <li>
          <strong>Tenant Scoring</strong> — Setiap tenant mendapatkan skor based
          on riwayat booking dan reputasi. Pemilik bisa melihat skor ini untuk
          membantu memutuskan apakah huniannya cocok untuk calon penyewa.
        </li>
      </ul>
    </StaticPageLayout>
  );
}
