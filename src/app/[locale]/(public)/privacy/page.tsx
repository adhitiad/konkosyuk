import { StaticPageLayout } from '@/components/static-page-layout'

export default function PrivacyPage() {
  return (
    <StaticPageLayout title="Kebijakan Privasi" lastUpdated="7 Agustus 2026">
      <h2>1. Informasi yang Kami Kumpulkan</h2>
      <p>
        Kami mengumpulkan informasi yang Anda berikan saat mendaftar, melakukan
        booking, atau menghubungi layanan kami, termasuk:
      </p>
      <ul>
        <li>Data profil (nama, email, nomor telepon)</li>
        <li>Data pembayaran (transaksi yang dilakukan melalui payment gateway)</li>
        <li>Data lokasi (alamat properti yang Anda cari atau daftarkan)</li>
      </ul>

      <h2>2. Bagaimana Kami Menggunakan Informasi Anda</h2>
      <p>
        Informasi Anda digunakan untuk memproses booking, memverifikasi
        identitas, mengirim notifikasi penting seputar akun dan transaksi,
        serta meningkatkan kualitas layanan KonkosYuk.
      </p>

      <h2>3. Berbagi Informasi dengan Pihak Ketiga</h2>
      <p>
        Kami hanya membagikan data Anda kepada pihak ketiga yang diperlukan
        untuk proses layanan, yaitu:
      </p>
      <ul>
        <li>
          Payment Gateway (Doku, Sakuku, Nicepay) untuk memproses pembayaran
          Anda.
        </li>
        <li>
          Kami tidak menjual, menyewakan, atau membagikan data Anda kepada
          pihak lain untuk kepentingan pemasaran tanpa izin Anda.
        </li>
      </ul>

      <h2>4. Keamanan Data</h2>
      <p>
        Kami menerapkan enkripsi password, secure session, dan praktik
        keamanan standar industri untuk melindungi data pribadi Anda.
      </p>

      <h2>5. Hak Anda</h2>
      <p>
        Anda memiliki hak untuk meminta penghapusan atau koreksi data pribadi
        Anda dengan menghubungi support@konkosyuk.com.
      </p>
    </StaticPageLayout>
  )
}
