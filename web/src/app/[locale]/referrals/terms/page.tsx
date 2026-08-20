import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Syarat & Ketentuan Referral",
  };
}

export default async function ReferralTermsPage() {
  return (
    <div className="container py-10 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Syarat & Ketentuan Program Referral KonkosYuk
          </h1>
          <p className="text-muted-foreground">
            Versi 2.5 — Berlaku untuk Owner & Penyewa
          </p>
          <p className="text-sm text-muted-foreground">
            Berlaku Efektif: 19 Agustus 2026
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2>BAB I: Ketentuan Umum</h2>
            <h3>1.1 Pendahuluan</h3>
            <p>
              Program Referral KonkosYuk (&quot;Program&quot;) merupakan program
              apresiasi bagi Pengguna yang berhasil mengajak pihak baru untuk
              bergabung dan bertransaksi di Platform. Pada Versi 2.5 ini,
              Program terbagi secara jelas ke dalam dua kategori terpisah dengan
              mekanisme, persentase perhitungan, dan ketentuan penggunaan saldo
              yang berbeda.
            </p>
            <h3>1.2 Definisi Umum</h3>
            <ul>
              <li>
                <strong>Platform:</strong> Situs web dan/atau aplikasi KonkosYuk
                yang menghubungkan Pemilik dan Penyewa.
              </li>
              <li>
                <strong>Referrer:</strong> Pengguna yang mengajak orang baru
                melalui Kode Referral. Dapat berupa Owner atau Penyewa.
              </li>
              <li>
                <strong>Referee:</strong> Orang baru yang mendaftar dan
                menyewa/mendaftarkan properti menggunakan Kode Referral.
              </li>
              <li>
                <strong>Referral Berhasil:</strong> Transaksi yang telah
                memenuhi seluruh syarat pencairan dan dananya telah dikreditkan
                ke Saldo Referral.
              </li>
              <li>
                <strong>Harga Sewa (Owner):</strong> Total nominal pembayaran
                sewa kamar yang berhasil tertransaksi di properti milik Referee
                per periode sewa (di luar biaya admin).
              </li>
              <li>
                <strong>Harga Sewa (Penyewa):</strong> Total nominal pembayaran
                sewa kamar pada transaksi Referee (di luar biaya admin, deposit,
                atau utilitas tambahan).
              </li>
              <li>
                <strong>Sewa Full / Lunas:</strong> Status pembayaran di mana
                Referee telah menyelesaikan pembayaran 100% dari total tagihan
                sewa periode tersebut.
              </li>
              <li>
                <strong>Masa Tanpa Refund:</strong> Jangka waktu 5 (lima) hari
                kalender sejak pembayaran lunas, di mana tidak ada permintaan
                pembatalan/pengembalian dana.
              </li>
              <li>
                <strong>Saldo Referral:</strong> Dompet digital terpisah di
                dalam akun yang menampung komisi referral yang sudah dicairkan.
              </li>
            </ul>
          </section>

          <section>
            <h2>BAB II: Kategori Owner (Pemilik Kos/Kontrakan)</h2>
            <h3>2.1 Kelayakan Referrer (Owner)</h3>
            <ul>
              <li>
                Terdaftar sebagai Pemilik di Platform KonkosYuk dan memiliki
                minimal 1 (satu) properti aktif yang terverifikasi.
              </li>
              <li>
                Akun dalam kondisi baik (tidak suspend/banned, tidak ada
                pelanggaran berat).
              </li>
            </ul>
            <h3>2.2 Kelayakan Referee (Yang Diajak)</h3>
            <ul>
              <li>
                Individu yang belum pernah terdaftar sebagai Pemilik di
                KonkosYuk, namun memiliki/mengelola minimal 1 properti.
              </li>
              <li>
                Bukan orang yang sama dengan Referrer (deteksi identitas
                KTP/NPWP/Bank) dan bukan properti yang dikelola pihak yang sama
                (mencegah kolusi).
              </li>
            </ul>
            <h3>2.3 Dasar Perhitungan & Tier Sistem (Owner)</h3>
            <p>
              <strong>Rumus Perhitungan:</strong>
            </p>
            <p>
              Komisi = Harga Sewa (Transaksi di properti Referee) &times;
              Persentase Tier
            </p>
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2">Tier</th>
                  <th className="border border-slate-300 p-2">
                    Jumlah Referral Berhasil (Kumulatif)
                  </th>
                  <th className="border border-slate-300 p-2">
                    Persentase Komisi
                  </th>
                  <th className="border border-slate-300 p-2">
                    Estimasi* (Rp 3.000.000 sewa)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2">TIER 1</td>
                  <td className="border border-slate-300 p-2">1 - 100 orang</td>
                  <td className="border border-slate-300 p-2">1.00%</td>
                  <td className="border border-slate-300 p-2">Rp 30.000</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">TIER 2</td>
                  <td className="border border-slate-300 p-2">
                    101 - 372 orang
                  </td>
                  <td className="border border-slate-300 p-2">2.00%</td>
                  <td className="border border-slate-300 p-2">Rp 60.000</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">TIER 3</td>
                  <td className="border border-slate-300 p-2">
                    373 - 846 orang
                  </td>
                  <td className="border border-slate-300 p-2">3.67%</td>
                  <td className="border border-slate-300 p-2">Rp 110.100</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">TIER 4</td>
                  <td className="border border-slate-300 p-2">
                    &ge; 847 orang
                  </td>
                  <td className="border border-slate-300 p-2">4.82%</td>
                  <td className="border border-slate-300 p-2">Rp 144.600</td>
                </tr>
              </tbody>
            </table>
            <h3>2.4 Mekanisme Penghasilan Komisi Owner</h3>
            <p>Komisi Owner bersifat berulang (recurring) parsial:</p>
            <ul>
              <li>
                Referrer mendapat komisi dari setiap penyewa baru yang berhasil
                menyewa di properti Referee.
              </li>
              <li>
                Pengecualian: Komisi tidak berlaku untuk perpanjangan sewa oleh
                penyewa yang sama. Hanya dihitung pada transaksi penyewa baru
                pertama kali di kamar tersebut setelah Referee terdaftar.
              </li>
            </ul>
          </section>

          <section>
            <h2>BAB III: Kategori Penyewa (Tenant)</h2>
            <h3>3.1 Kelayakan Referrer (Penyewa)</h3>
            <ul>
              <li>
                Terdaftar sebagai Penyewa Aktif (sedang menyewa dan/atau
                memiliki kontrak sewa berjalan).
              </li>
              <li>Akun dalam kondisi baik (tidak ada tunggakan pembayaran).</li>
            </ul>
            <h3>3.2 Kelayakan Referee (Yang Diajak)</h3>
            <ul>
              <li>
                Individu yang belum pernah terdaftar sebagai Penyewa di
                Platform.
              </li>
              <li>
                Bukan orang dengan identitas yang sama dengan Referrer (deteksi
                duplikasi akun).
              </li>
            </ul>
            <h3>3.3 Dasar Perhitungan & Tier Sistem (Penyewa)</h3>
            <p>
              <strong>Rumus Perhitungan:</strong>
            </p>
            <p>
              Komisi = Harga Sewa (Kamar yang disewa Referee) &times; Persentase
              Tier
            </p>
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2">Tier</th>
                  <th className="border border-slate-300 p-2">
                    Jumlah Referral Berhasil (Kumulatif)
                  </th>
                  <th className="border border-slate-300 p-2">
                    Persentase Komisi
                  </th>
                  <th className="border border-slate-300 p-2">
                    Estimasi* (Rp 2.500.000 sewa)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2">TIER 1</td>
                  <td className="border border-slate-300 p-2">1 - 100 orang</td>
                  <td className="border border-slate-300 p-2">0.90%</td>
                  <td className="border border-slate-300 p-2">Rp 22.500</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">TIER 2</td>
                  <td className="border border-slate-300 p-2">
                    101 - 372 orang
                  </td>
                  <td className="border border-slate-300 p-2">1.86%</td>
                  <td className="border border-slate-300 p-2">Rp 46.500</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">TIER 3</td>
                  <td className="border border-slate-300 p-2">
                    373 - 846 orang
                  </td>
                  <td className="border border-slate-300 p-2">2.79%</td>
                  <td className="border border-slate-300 p-2">Rp 69.750</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">TIER 4</td>
                  <td className="border border-slate-300 p-2">
                    &ge; 847 orang
                  </td>
                  <td className="border border-slate-300 p-2">3.96%</td>
                  <td className="border border-slate-300 p-2">Rp 99.000</td>
                </tr>
              </tbody>
            </table>
            <h3>3.4 Mekanisme Penghasilan Komisi Penyewa</h3>
            <p>Komisi Penyewa bersifat Satu Kali (One-Time):</p>
            <ul>
              <li>
                Referrer mendapat komisi sekali per Referee yang berhasil
                menyewa.
              </li>
              <li>
                Jika Referee memperpanjang sewa di bulan berikutnya atau pindah
                ke kamar lain, hal tersebut tidak menghasilkan komisi baru bagi
                Referrer.
              </li>
            </ul>
          </section>

          <section>
            <h2>BAB IV: Ketentuan Tier (Berlaku Owner & Penyewa)</h2>
            <ul>
              <li>
                <strong>Kumulatif & Permanen:</strong> Tier naik berdasarkan
                total referral valid dan tidak pernah turun.
              </li>
              <li>
                <strong>Berlaku Ke Depan:</strong> Persentase baru hanya berlaku
                untuk transaksi setelah tier tercapai (tidak retroaktif).
              </li>
              <li>
                <strong>Syarat Validitas:</strong> Hanya referral yang dananya
                sudah dicairkan yang masuk hitungan kumulatif.
              </li>
            </ul>
          </section>

          <section>
            <h2>BAB V: Syarat Pencairan Mutlak</h2>
            <p>
              Dana referral TIDAK langsung cair. Dana baru masuk antrian jika
              memenuhi 2 (dua) syarat wajib secara berurutan:
            </p>
            <ol>
              <li>
                <strong>Syarat 1: Sewa Full (Lunas)</strong> — Referee
                menyelesaikan 100% tagihan via Payment Gateway.
              </li>
              <li>
                <strong>Syarat 2: 5 Hari Tanpa Refund</strong> — Masa pantau
                5x24 jam sejak pelunasan.
              </li>
            </ol>
            <p>
              Dana yang lolos verifikasi akan masuk status &quot;Layak
              Cair&quot; dan menunggu jadwal pencairan terdekat.
            </p>
            <h3>5.1 Penjelasan Detail Syarat</h3>
            <ul>
              <li>
                Syarat #1 (Lunas 100%): Berlaku untuk semua metode pembayaran
                resmi (Doku, iPaymu, Nicepay, dll). Jika Referee menggunakan
                metode cicilan, komisi baru mulai dihitung setelah cicilan
                terakhir lunas.
              </li>
              <li>
                Syarat #2 (5 Hari Tanpa Refund): Terhitung mulai pukul 00:01 WIB
                hari berikutnya setelah pelunasan, hingga pukul 23:59 WIB pada
                hari ke-5. Pengajuan refund, pembatalan, atau chargeback pada
                detik-detik terakhir hari ke-5 akan langsung menggagalkan
                referral.
              </li>
            </ul>
          </section>

          <section>
            <h2>BAB VI: Jadwal Pencairan Otomatis</h2>
            <p>
              Dana berstatus &quot;Layak Cair&quot; akan dikreditkan ke Saldo
              Referral pada jadwal berikut:
            </p>
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2">Bulan</th>
                  <th className="border border-slate-300 p-2">Pencairan #1</th>
                  <th className="border border-slate-300 p-2">Pencairan #2</th>
                  <th className="border border-slate-300 p-2">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2">
                    Bulan Standar (11 Bulan)
                  </td>
                  <td className="border border-slate-300 p-2">Tanggal 16</td>
                  <td className="border border-slate-300 p-2">Tanggal 30</td>
                  <td className="border border-slate-300 p-2">
                    Dicairkan 2x dalam sebulan
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">
                    Februari (Biasa/Kabisat)
                  </td>
                  <td className="border border-slate-300 p-2">
                    Tgl 28 / Tgl 29
                  </td>
                  <td className="border border-slate-300 p-2">-</td>
                  <td className="border border-slate-300 p-2">
                    Hanya 1x pencairan di akhir bulan
                  </td>
                </tr>
              </tbody>
            </table>
            <p>
              <strong>Aturan Antrian (Batas Waktu):</strong> Dana yang tembus
              status &quot;Layak Cair&quot; melewati tanggal pencairan, otomatis
              masuk jadwal berikutnya.
            </p>
          </section>

          <section>
            <h2>BAB VII: Penggunaan & Penarikan Saldo</h2>
            <h3>7.1 Penarikan Tunai (Berlaku Owner & Penyewa)</h3>
            <ul>
              <li>
                <strong>Tarik ke Bank:</strong> Minimal Rp 50.000 (Proses 1-3
                hari kerja).
              </li>
              <li>
                <strong>Tarik ke E-Wallet (GoPay/OVO/DANA/ShopeePay):</strong>{" "}
                Minimal Rp 25.000 (Instan - 1 hari kerja).
              </li>
              <li>
                Syarat mutlak: Nama di rekening bank/e-wallet wajib identik
                dengan nama identitas terverifikasi di akun KonkosYuk.
              </li>
            </ul>
            <h3>7.2 Fitur Khusus Owner (Opsi Voucher Diskon)</h3>
            <p>
              Owner dapat menukar Saldo Referral menjadi Voucher Diskon Layanan
              KonkosYuk:
            </p>
            <ul>
              <li>
                Maksimal Diskon: 50% dari harga paket layanan (Listing Premium
                atau Fitur Promosi).
              </li>
              <li>
                Ketentuan: Masa berlaku 30 hari (Listing) atau 14 hari
                (Promosi). Voucher tidak dapat diuangkan kembali atau
                dipindahtangankan. Sisa saldo yang tidak terkonversi tetap aman
                di dompet.
              </li>
            </ul>
            <h3>7.3 Fitur Khusus Penyewa (Potong Tagihan Sewa)</h3>
            <p>
              Penyewa dapat menggunakan saldo untuk melunasi tagihan kos
              berjalan:
            </p>
            <ul>
              <li>
                Otomatis dipotong dari tagihan bulan berikutnya (Minimal
                pemakaian Rp 10.000).
              </li>
              <li>
                Jika saldo lebih kecil dari tagihan, sisa kekurangan dibayar
                melalui metode reguler.
              </li>
              <li>
                Tidak berlaku untuk pembayaran denda atau utilitas tambahan di
                luar harga sewa pokok.
              </li>
            </ul>
          </section>

          <section>
            <h2>BAB VIII: Larangan & Sanksi</h2>
            <p>
              Untuk menjaga ekosistem yang sehat, sistem kami menerapkan sanksi
              tegas bertingkat (Peringatan &rarr; Suspend &rarr; Banned
              Permanen):
            </p>
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2">
                    Jenis Pelanggaran
                  </th>
                  <th className="border border-slate-300 p-2">Kategori</th>
                  <th className="border border-slate-300 p-2">Sanksi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2">
                    Mendaftarkan akun palsu/keluarga untuk menyewa sendiri
                  </td>
                  <td className="border border-slate-300 p-2">Berat</td>
                  <td className="border border-slate-300 p-2">
                    Banned Permanen + Tarik Komisi
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">
                    Berkolusi/kerjasama untuk membuat transaksi fiktif
                  </td>
                  <td className="border border-slate-300 p-2">Berat</td>
                  <td className="border border-slate-300 p-2">
                    Banned Permanen + Tuntutan Hukum
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">
                    Menawarkan kickback (bagi-bagi komisi) kepada Referee
                  </td>
                  <td className="border border-slate-300 p-2">Sedang</td>
                  <td className="border border-slate-300 p-2">
                    Suspend (30-90 hari) + Turun ke Tier 1
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">
                    Menyebarkan kode via spam email, SMS, atau komentar
                  </td>
                  <td className="border border-slate-300 p-2">Ringan</td>
                  <td className="border border-slate-300 p-2">
                    Peringatan &rarr; Suspend
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">
                    Membayar tagihan Referee demi mengejar syarat
                    &quot;Lunas&quot;
                  </td>
                  <td className="border border-slate-300 p-2">Sedang</td>
                  <td className="border border-slate-300 p-2">
                    Pembatalan Komisi + Suspend
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">
                    (Owner) Memakai voucher diskon di properti milik pihak lain
                  </td>
                  <td className="border border-slate-300 p-2">Sedang</td>
                  <td className="border border-slate-300 p-2">
                    Pembatalan Voucher + Suspend
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm text-muted-foreground">
              KonkosYuk berhak membatalkan komisi yang sudah berstatus
              &quot;Layak Cair&quot; jika ditemukan anomali atau indikasi
              manipulasi pasca-verifikasi.
            </p>
          </section>

          <section>
            <h2>BAB IX: Dashboard & Transparansi</h2>
            <p>
              Referrer akan difasilitasi dengan Dashboard Referral komprehensif,
              mencakup:
            </p>
            <ul>
              <li>
                <strong>Live Tracking:</strong> Memantau status setiap Referee
                (Pending, Verifikasi, Gagal, Cair).
              </li>
              <li>
                <strong>Statistik Tier:</strong> Menampilkan posisi persentase
                saat ini dan sisa target menuju Tier selanjutnya.
              </li>
              <li>
                <strong>Riwayat Keuangan:</strong> Log transparan untuk semua
                uang masuk (pencairan) dan uang keluar (penarikan/potong
                tagihan/voucher).
              </li>
              <li>
                <strong>Notifikasi Pintar:</strong> Pemberitahuan otomatis
                (In-App & Email) sejak Referee mendaftar, pelunasan berhasil,
                lolos verifikasi 5 hari, hingga komisi landing di saldo.
              </li>
            </ul>
          </section>

          <section>
            <h2>BAB X: Ketentuan Penutup</h2>
            <ul>
              <li>
                <strong>Perubahan Kebijakan:</strong> KonkosYuk berhak mengubah
                S&K ini dengan pemberitahuan minimal 14 hari kalender. Perubahan
                tidak bersifat retroaktif pada komisi yang sudah &quot;Layak
                Cair&quot;.
              </li>
              <li>
                <strong>Keterbatasan Tanggung Jawab (Force Majeure):</strong>{" "}
                Keterlambatan pencairan akibat gangguan dari pihak ketiga (Bank,
                Payment Gateway, Server) bukan merupakan pelanggaran oleh
                Platform.
              </li>
              <li>
                <strong>Pajak:</strong> Komisi referral adalah penghasilan
                tambahan. KonkosYuk tidak memotong pajak (Gross). Tanggung jawab
                pelaporan SPT Tahunan PPh Orang Pribadi sepenuhnya berada di
                tangan Referrer.
              </li>
              <li>
                <strong>Yurisdiksi:</strong> Dokumen ini tunduk pada Hukum
                Republik Indonesia.
              </li>
            </ul>
          </section>

          <section>
            <h2>Pusat Bantuan Referral</h2>
            <ul>
              <li>
                <strong>Email:</strong> referral@konkosyuk.com
              </li>
              <li>
                <strong>Menu Bantuan:</strong> &quot;Help Center&quot; di
                Aplikasi / Website
              </li>
              <li>
                <strong>Operasional:</strong> Senin - Jumat (08:00 - 17:00 WIB)
              </li>
            </ul>
          </section>

          <section>
            <h2>Pernyataan Persetujuan</h2>
            <p>
              Dengan mendaftar, membagikan kode referral, atau menggunakan fitur
              referral, Anda menyatakan bahwa:
            </p>
            <ul>
              <li>
                Saya telah membaca, memahami, dan menyetujui seluruh isi S&K
                Versi 2.5 ini.
              </li>
              <li>
                Saya mengerti batas perbedaan hak antara Kategori Owner dan
                Kategori Penyewa.
              </li>
              <li>
                Saya paham sepenuhnya bahwa komisi bukanlah hak instan,
                melainkan tunduk pada syarat Lunas 100% dan Masa Pantau 5 Hari
                Tanpa Refund.
              </li>
              <li>
                Saya bersedia bertanggung jawab secara pribadi terkait pelaporan
                pajak penghasilan dari komisi ini.
              </li>
              <li>
                Saya menerima segala sanksi (termasuk banned permanen) jika
                sistem KonkosYuk mendeteksi adanya manipulasi atau kecurangan.
              </li>
            </ul>
            <p className="font-semibold">KonkosYuk</p>
            <p>Dikelola oleh: [Nama Badan Hukum Pengelola]</p>
            <p>Tanggal Berlaku: 19 Agustus 2026</p>
            <p>Versi Dokumen: 2.5 (Integrasi Komprehensif Owner & Penyewa)</p>
          </section>
        </div>
      </div>
    </div>
  );
}
