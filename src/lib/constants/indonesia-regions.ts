export const PROVINCES = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Jambi',
  'Sumatera Selatan',
  'Bengkulu',
  'Lampung',
  'Kepulauan Bangka Belitung',
  'Kepulauan Riau',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Banten',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Sulawesi Tengah',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Gorontalo',
  'Sulawesi Barat',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
  'Papua Selatan',
  'Papua Tengah',
  'Papua Pegunungan',
  'Papua Barat Daya',
] as const

export const CITIES_BY_PROVINCE: Record<string, string[]> = {
  Aceh: [
    'Banda Aceh', 'Langsa', 'Lhokseumawe', 'Meulaboh', 'Sabang',
    'Subulussalam', 'Aceh Besar', 'Aceh Tamiang', 'Aceh Barat', 'Aceh Barat Daya',
    'Aceh Jaya', 'Aceh Selatan', 'Aceh Singkil', 'Aceh Tegal', 'Bener Meriah',
    'Bireuen', 'Gayo Lues', 'Nagan Raya', 'Pidie', 'Pidie Jaya',
    'Simeulue', 'Banda Aceh', 'Langsa', 'Lhokseumawe', 'Meulaboh', 'Sabang', 'Subulussalam'
  ],
  'Sumatera Utara': [
    'Medan', 'Binjai', 'Pematang Siantar', 'Tebing Tinggi', 'Tanjung Balai',
    'Padangsidempuan', 'Sibolga', 'Gunungsitoli', 'Asahan', 'Dairi',
    'Deli Serdang', 'Karo', 'Langkat', 'Mandailing Natal', 'Nias',
    'Padang Lawas', 'Pakpak Bharat', 'Samosir', 'Serdang Bedagai', 'Simalungun',
    'Tapanuli Selatan', 'Tapanuli Tengah', 'Tapanuli Utara', 'Toba Samosir', 'Medan', 'Binjai', 'Pematang Siantar', 'Tebing Tinggi', 'Tanjung Balai'
  ],
  'Sumatera Barat': [
    'Padang', 'Bukittinggi', 'Payakumbuh', 'Pariaman', 'Sawahlunto',
    'Solok', 'Padang Panjang', 'Agam', 'Dharmasraya', 'Kepulauan Mentawai',
    'Lima Puluh Kota', 'Padang Pariaman', 'Pasaman', 'Pasaman Barat', 'Pesisir Selatan',
    'Sijunjung', 'Solok Selatan', 'Tanah Datar', 'Padang', 'Bukittinggi', 'Payakumbuh', 'Pariaman', 'Sawahlunto'
  ],
  Riau: [
    'Pekanbaru', 'Dumai', 'Bengkalis', 'Indragiri Hulu', 'Indragiri Hilir',
    'Kampar', 'Kepulauan Meranti', 'Kuantan Singingi', 'Pelalawan', 'Rokan Hilir',
    'Rokan Hulu', 'Siak', 'Pekanbaru', 'Dumai'
  ],
  Jambi: [
    'Jambi', 'Sungai Penuh', 'Batang Hari', 'Bungo', 'Kerinci',
    'Merangin', 'Muaro Jambi', 'Sarolangun', 'Tanjung Jabung Barat', 'Tanjung Jabung Timur',
    'Tebo', 'Jambi', 'Sungai Penuh'
  ],
  'Sumatera Selatan': [
    'Palembang', 'Prabumulih', 'Lubuklinggau', 'Pagar Alam', 'Banyuasin',
    'Empat Lawang', 'Lahat', 'Muara Enim', 'Musi Banyuasin', 'Musi Rawas',
    'Ogan Ilir', 'Ogan Komering Ilir', 'Ogan Komering Ulu', 'Penukal Abab Lematang Ilir', 'Palembang', 'Prabumulih', 'Lubuklinggau', 'Pagar Alam'
  ],
  Bengkulu: [
    'Bengkulu', 'Bengkulu Selatan', 'Bengkulu Tengah', 'Bengkulu Utara', 'Kaur',
    'Kepahiang', 'Lebong', 'Muko Muko', 'Rejang Lebong', 'Seluma', 'Bengkulu'
  ],
  Lampung: [
    'Bandar Lampung', 'Metro', 'Lampung Barat', 'Lampung Selatan', 'Lampung Tengah',
    'Lampung Timur', 'Lampung Utara', 'Mesuji', 'Pesawaran', 'Pringsewu',
    'Tulang Bawang', 'Tulang Bawang Barat', 'Way Kanan', 'Pesisir Barat', 'Bandar Lampung', 'Metro'
  ],
  'Kepulauan Bangka Belitung': [
    'Pangkal Pinang', 'Bangka Barat', 'Bangka Selatan', 'Bangka Tengah', 'Bangka',
    'Belitung', 'Belitung Timur', 'Pangkal Pinang'
  ],
  'Kepulauan Riau': [
    'Tanjung Pinang', 'Batam', 'Bintan', 'Karimun', 'Lingga',
    'Natuna', 'Anambas', 'Tanjung Pinang', 'Batam'
  ],
  'DKI Jakarta': [
    'Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur',
    'Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur'
  ],
  'Jawa Barat': [
    'Bandung', 'Bekasi', 'Bogor', 'Cimahi', 'Depok',
    'Sukabumi', 'Tasikmalaya', 'Banjar', 'Bandung Barat', 'Cirebon',
    'Garut', 'Indramayu', 'Karawang', 'Kuningan', 'Majalengka',
    'Pangandaran', 'Purwakarta', 'Subang', 'Sumber', 'Sumedang',
    'Bandung', 'Bekasi', 'Bogor', 'Cimahi', 'Depok'
  ],
  'Jawa Tengah': [
    'Semarang', 'Surakarta', 'Magelang', 'Pekalongan', 'Tegal',
    'Banjarnegara', 'Banyumas', 'Batang', 'Blora', 'Boyolali',
    'Brebes', 'Cilacap', 'Demak', 'Grobogan', 'Jepara',
    'Karanganyar', 'Kebumen', 'Kendal', 'Klaten', 'Kudus',
    'Magelang', 'Pati', 'Pemalang', 'Purbalingga', 'Purworejo',
    'Rembang', 'Salatiga', 'Semarang', 'Sragen', 'Sukoharjo',
    'Surakarta', 'Tegal', 'Temanggung', 'Wonosobo', 'Semarang', 'Surakarta', 'Magelang', 'Pekalongan', 'Tegal'
  ],
  'DI Yogyakarta': [
    'Yogyakarta', 'Bantul', 'Gunungkidul', 'Kulon Progo', 'Sleman',
    'Yogyakarta', 'Bantul', 'Gunungkidul', 'Kulon Progo', 'Sleman'
  ],
  'Jawa Timur': [
    'Surabaya', 'Malang', 'Batu', 'Kediri', 'Blitar',
    'Madiun', 'Mojokerto', 'Pasuruan', 'Probolinggo', 'Jember',
    'Banyuwangi', 'Bondowoso', 'East Java', 'Gresik', 'Jombang',
    'Lamongan', 'Lumajang', 'Nganjuk', 'Ngawi', 'Pacitan',
    'Pamekasan', 'Ponorogo', 'Sampang', 'Sidoarjo', 'Sumenep',
    'Trenggalek', 'Tuban', 'Surabaya', 'Malang', 'Batu', 'Kediri', 'Blitar'
  ],
  Banten: [
    'Tangerang', 'Serang', 'Tangerang Selatan', 'Cilegon', 'Lebak',
    'Pandeglang', 'Serang', 'Tangerang', 'Tangerang Selatan', 'Cilegon'
  ],
  Bali: [
    'Denpasar', 'Badung', 'Bangli', 'Buleleng', 'Gianyar',
    'Jembrana', 'Karangasem', 'Klungkung', 'Tabanan', 'Denpasar'
  ],
  'Nusa Tenggara Barat': [
    'Mataram', 'Bima', 'Kupang', 'Alor', 'Belu',
    'Flores Timur', 'Lembata', 'Malaka', 'Manggarai', 'Manggarai Barat',
    'Manggarai Timur', 'Ngada', 'Nagekeo', 'Rote Ndao', 'Sabu Raijua',
    'Sikka', 'Sumba Barat', 'Sumba Barat Daya', 'Sumba Tengah', 'Sumba Timur',
    'Taliwang', 'Mataram', 'Bima', 'Kupang'
  ],
  'Nusa Tenggara Timur': [
    'Kupang', 'Kupang Barat', 'Kupang Timur', 'Rote Ndao', 'Manggarai',
    'Manggarai Barat', 'Manggarai Timur', 'Nagekeo', 'Ngada', 'Alor',
    'Belu', 'Ende', 'Flores Timur', 'Lembata', 'Sabu Raijua',
    'Sikka', 'Sumba Barat', 'Sumba Barat Daya', 'Sumba Tengah', 'Sumba Timur',
    'Timor Tengah Selatan', 'Timor Tengah Utara', 'Kupang'
  ],
  'Kalimantan Barat': [
    'Pontianak', 'Singkawang', 'Bengkayang', 'Kapuas Hulu', 'Kayong Utara',
    'Ketapang', 'Kubu Raya', 'Landak', 'Mempawah', 'Melawi',
    'Sambas', 'Sanggau', 'Sekadau', 'Sintang', 'Pontianak', 'Singkawang'
  ],
  'Kalimantan Tengah': [
    'Palangka Raya', 'Barito Selatan', 'Barito Timur', 'Barito Utara', 'Gunung Mas',
    'Kapuas', 'Katingan', 'Kotawaringin Barat', 'Kotawaringin Timur', 'Lamandau',
    'Murung Raya', 'Pulang Pisau', 'Seruyan', 'Sukamara', 'Palangka Raya'
  ],
  'Kalimantan Selatan': [
    'Banjarmasin', 'Banjarbaru', 'Balangan', 'Banjar', 'Barito Kuala',
    'Hulu Sungai Selatan', 'Hulu Sungai Tengah', 'Hulu Sungai Utara', 'Kotabaru', 'Tabalong',
    'Tanah Bumbu', 'Tanah Laut', 'Tapin', 'Banjarmasin', 'Banjarbaru'
  ],
  'Kalimantan Timur': [
    'Samarinda', 'Balikpapan', 'Bontang', 'Berau', 'Kutai Barat',
    'Kutai Kartanegara', 'Kutai Timur', 'Mahakam Ulu', 'Paser', 'Penajam',
    'Penajam North Paser', 'Samarinda', 'Balikpapan', 'Bontang'
  ],
  'Kalimantan Utara': [
    'Tarakan', 'Bulungan', 'Malinau', 'Nunukan', 'Tana Tidung',
    'Tarakan'
  ],
  'Sulawesi Utara': [
    'Manado', 'Bitung', 'Tomohon', 'Kotamobagu', 'Bolaang Mongondow',
    'Bolaang Mongondow Selatan', 'Bolaang Mongondow Timur', 'Bolaang Mongondow Utara', 'Kepulauan Sangihe', 'Kepulauan Sitaro',
    'Minahasa', 'Minahasa Selatan', 'Minahasa Tenggara', 'Minahasa Utara', 'Talaud', 'Manado', 'Bitung', 'Tomohon', 'Kotamobagu'
  ],
  'Sulawesi Tengah': [
    'Palu', 'Banggai', 'Banggai Kepulauan', 'Buol', 'Donggala',
    'Morowali', 'Morowali Utara', 'Parigi Moutong', 'Poso', 'Sigi',
    'Tojo Una-Una', 'Toli-Toli', 'Palu'
  ],
  'Sulawesi Selatan': [
    'Makassar', 'Palopo', 'Parepare', 'Bantaeng', 'Barru',
    'Bone', 'Bulukumba', 'Enrekang', 'Gowa', 'Jeneponto',
    'Luwu', 'Luwu Timur', 'Luwu Utara', 'Maros', 'Pangkajene Kepulauan',
    'Pinrang', 'Selayar', 'Sidenreng Rappang', 'Sinjai', 'Soppeng',
    'Takalar', 'Tana Toraja', 'Toraja Utara', 'Wajo', 'Makassar', 'Palopo', 'Parepare'
  ],
  'Sulawesi Tenggara': [
    'Kendari', 'Baubau', 'Bombana', 'Buton', 'Buton Selatan',
    'Buton Tengah', 'Buton Utara', 'Konawe', 'Konawe Kepulauan', 'Konawe Selatan',
    'Konawe Utara', 'Kolaka', 'Kolaka Timur', 'Kolaka Utara', 'Muna',
    'Muna Barat', 'Wakatobi', 'Kendari', 'Baubau'
  ],
  Gorontalo: [
    'Gorontalo', 'Boalemo', 'Bone Bolango', 'Gorontalo', 'Gorontalo Utara',
    'Pohuwato', 'Gorontalo'
  ],
  'Sulawesi Barat': [
    'Mamuju', 'Majene', 'Mamasa', 'Mamuju Tengah', 'Mamuju Utara',
    'Polewali Mandar', 'Mamuju'
  ],
  Maluku: [
    'Ambon', 'Tual', 'Buru', 'Buru Selatan', 'Kepulauan Aru',
    'Maluku Barat Daya', 'Maluku Tengah', 'Maluku Tenggara', 'Maluku Tenggara Barat', 'Seram Bagian Barat',
    'Seram Bagian Timur', 'Ambon', 'Tual'
  ],
  'Maluku Utara': [
    'Ternate', 'Tidore', 'Halmahera Barat', 'Halmahera Selatan', 'Halmahera Tengah',
    'Halmahera Timur', 'Halmahera Utara', 'Kepulauan Sula', 'Pulau Morotai', 'Pulau Taliabu',
    'Ternate', 'Tidore'
  ],
  Papua: [
    'Jayapura', 'Biak Numfor', 'Jayapura', 'Keerom', 'Kepulauan Yapen',
    'Mamberamo Raya', 'Mappi', 'Merauke', 'Nabire', 'Nduga',
    'Paniai', 'Pegunungan Bintang', 'Supiori', 'Sarmi', 'Tolikara',
    'Waropen', 'Yahukimo', 'Yalimo', 'Jayapura'
  ],
  'Papua Barat': [
    'Manokwari', 'Fakfak', 'Kaimana', 'Manokwari', 'Manokwari Selatan',
    'Maybrat', 'Pegunungan Arfak', 'Raja Ampat', 'Sorong', 'Sorong Selatan',
    'Tambrauw', 'Teluk Bintuni', 'Teluk Wondama', 'Manokwari', 'Sorong'
  ],
  'Papua Selatan': [
    'Merauke', 'Boven Digoel', 'Mappi', 'Asmat', 'Agats',
    'Merauke'
  ],
  'Papua Tengah': [
    'Nabire', 'Paniai', 'Intan Jaya', 'Deiyai', 'Dogiyai',
    'Nabire'
  ],
  'Papua Pegunungan': [
    'Wamena', 'Jayawijaya', 'Lanny Jaya', 'Nduga', 'Pegunungan Bintang',
    'Wamena'
  ],
  'Papua Barat Daya': [
    'Sorong', 'Sorong Selatan', 'Maybrat', 'Tambrauw', 'Teluk Bintuni',
    'Teluk Wondama', 'Sorong'
  ],
}
