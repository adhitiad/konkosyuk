import { StaticPageLayout } from '@/components/static-page-layout'

export default function TermsPage() {
  return (
    <StaticPageLayout title="Syarat & Ketentuan" lastUpdated="7 Agustus 2026">
      <h2>1. Penerimaan Syarat</h2>
      <p>
        Dengan menggunakan KonkosYuk, Anda menyetujui seluruh aturan dan
        ketentuan yang berlaku. Jika Anda tidak menyetujui, mohon untuk tidak
        menggunakan layanan kami.
      </p>

      <h2>2. Akun Pengguna</h2>
      <p>
        Anda bertanggung jawab untuk menjaga kerahasiaan akun dan password
        Anda. Dilarang membuat akun palsu, menggunakan identitas orang lain,
        atau menyalahgunakan layanan untuk kegiatan ilegal.
      </p>

      <h2>3. Aturan Booking & Pembayaran</h2>
      <ul>
        <li>Tenant wajib melakukan pembayaran DP sebesar 35% untuk menjamin booking.</li>
        <li>Pelunasan 65% harus dilakukan sebelum tanggal check-in.</li>
        <li>Dilarang melakukan penipuan, chargeback tanpa alasan yang sah, atau memanipulasi data booking.</li>
      </ul>

      <h2>4. Peran KonkosYuk</h2>
      <p>
        KonkosYuk berperan sebagai platform perantara. Kami bukan pemilik
        properti dan tidak bertanggung jawab atas kondisi fisik hunian. Sengketa
        antara tenant dan owner diselesaikan melalui Pusat Resolusi KonkosYuk
        dengan prinsip fairness dan transparansi.
      </p>

      <h2>5. Pembatasan Tanggung Jawab</h2>
      <p>
        Kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul
        dari penggunaan layanan. KonkosYuk tidak menjamin ketersediaan unit
        properti 100% karena ketergantungan pada data yang diberikan oleh
        owner.
      </p>
    </StaticPageLayout>
  )
}
