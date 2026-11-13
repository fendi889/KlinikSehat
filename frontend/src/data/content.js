// Data statis sementara. Pada BAB 4 diganti dengan data dari API /public/*.
export const clinic = {
  nama: 'KlinikSehat',
  alamat: 'Jl. Kesehatan No. 25, Menteng, Jakarta Pusat 10310',
  telp: '(021) 5550 1234',
  wa: '0812-3456-7890',
  email: 'halo@kliniksehat.id',
  jam: 'Senin–Sabtu 07.30–21.00, Minggu 08.00–14.00',
}

export const stats = [
  { nilai: '12.400+', label: 'Pasien terlayani' },
  { nilai: '18', label: 'Dokter praktik' },
  { nilai: '7', label: 'Poli tersedia' },
  { nilai: '4,8/5', label: 'Rating pasien' },
]

export const visi = 'Menjadi klinik rawat jalan terpercaya yang membuat layanan kesehatan terasa tertib, hangat, dan mudah dijangkau.'
export const misi = [
  'Memberikan pemeriksaan yang teliti dengan dokter dan perawat berizin.',
  'Memangkas waktu tunggu lewat pendaftaran dan antrian online.',
  'Menjaga rekam medis pasien tetap rapi, aman, dan mudah diakses pemiliknya.',
  'Menyediakan obat yang tepat dengan stok yang diawasi ketat.',
]

export const layanan = [
  { nama: 'Poli Umum', desc: 'Pemeriksaan demam, batuk, nyeri, hipertensi, diabetes, dan keluhan harian.', tarif: 'Mulai Rp75.000' },
  { nama: 'Poli Gigi', desc: 'Pembersihan karang gigi, tambal, cabut, dan konsultasi.', tarif: 'Mulai Rp120.000' },
  { nama: 'Poli Anak', desc: 'Tumbuh kembang, imunisasi, dan penyakit anak.', tarif: 'Mulai Rp110.000' },
  { nama: 'Poli Kandungan', desc: 'Pemeriksaan kehamilan, USG, dan kesehatan reproduksi.', tarif: 'Mulai Rp150.000' },
  { nama: 'Poli Penyakit Dalam', desc: 'Pengelolaan penyakit kronis dan pemeriksaan lanjutan.', tarif: 'Mulai Rp140.000' },
  { nama: 'Laboratorium', desc: 'Cek darah, gula darah, kolesterol, dan urin dengan hasil digital.', tarif: 'Mulai Rp35.000' },
]

export const dokter = [
  { id: 1, nama: 'dr. Anisa Rahmawati', poli: 'Poli Umum', pengalaman: '9 tahun', inisial: 'AR' },
  { id: 2, nama: 'drg. Bima Pratama', poli: 'Poli Gigi', pengalaman: '7 tahun', inisial: 'BP' },
  { id: 3, nama: 'dr. Citra Lestari, Sp.A', poli: 'Poli Anak', pengalaman: '12 tahun', inisial: 'CL' },
  { id: 4, nama: 'dr. Dimas Hartono, Sp.OG', poli: 'Poli Kandungan', pengalaman: '14 tahun', inisial: 'DH' },
  { id: 5, nama: 'dr. Erika Wulandari, Sp.PD', poli: 'Poli Penyakit Dalam', pengalaman: '11 tahun', inisial: 'EW' },
  { id: 6, nama: 'dr. Fajar Nugroho', poli: 'Poli Umum', pengalaman: '6 tahun', inisial: 'FN' },
]

export const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
// jadwal[idDokter] = jam per hari (null = libur)
export const jadwal = {
  1: ['08.00–12.00', null, '08.00–12.00', null, '08.00–12.00', '08.00–11.00'],
  2: [null, '09.00–15.00', null, '09.00–15.00', null, '09.00–13.00'],
  3: ['13.00–17.00', '13.00–17.00', null, '13.00–17.00', null, null],
  4: [null, null, '14.00–18.00', null, '14.00–18.00', '09.00–12.00'],
  5: ['16.00–20.00', null, '16.00–20.00', '16.00–20.00', null, null],
  6: ['13.00–20.00', '13.00–20.00', null, null, '13.00–20.00', '12.00–16.00'],
}

export const alur = [
  { judul: 'Buat akun', desc: 'Daftar sebagai pasien dengan nomor HP dan email.' },
  { judul: 'Pilih poli dan dokter', desc: 'Lihat jadwal praktik dan pilih waktu yang cocok.' },
  { judul: 'Ambil nomor antrian', desc: 'Nomor langsung terbit dan bisa dipantau dari HP.' },
  { judul: 'Datang dan verifikasi', desc: 'Tunjukkan nomor antrian ke perawat, lalu cek tanda vital.' },
  { judul: 'Periksa dan ambil obat', desc: 'Dokter memeriksa, apoteker menyiapkan resep, bayar di kasir atau online.' },
]

export const fasilitas = [
  'Ruang tunggu ber-AC dengan layar antrian',
  'Laboratorium mini dengan hasil digital',
  'Apotek di tempat',
  'Ruang tindakan steril',
  'Parkir motor dan mobil',
  'Akses kursi roda dan toilet ramah disabilitas',
]

export const testimoni = [
  { nama: 'Rina S.', teks: 'Daftar dari rumah, datang pas dipanggil. Tidak ada lagi menunggu satu jam di ruang tunggu.', poli: 'Poli Anak' },
  { nama: 'Budi H.', teks: 'Dokternya menjelaskan hasil lab dengan sabar, dan riwayat periksa saya bisa dilihat kapan saja.', poli: 'Penyakit Dalam' },
  { nama: 'Maya L.', teks: 'Obat langsung siap begitu selesai konsultasi. Pembayarannya juga jelas, rinciannya lengkap.', poli: 'Poli Umum' },
]

export const artikel = [
  { slug: 'tekanan-darah-tinggi', judul: 'Tekanan darah tinggi: kapan harus ke dokter?', ringkas: 'Kenali angka tekanan darah yang perlu diwaspadai dan kebiasaan harian yang membantu menurunkannya.', tanggal: '3 November 2026' },
  { slug: 'imunisasi-anak', judul: 'Jadwal imunisasi anak usia 0–2 tahun', ringkas: 'Panduan singkat imunisasi dasar dan lanjutan agar tidak ada yang terlewat.', tanggal: '27 Oktober 2026' },
  { slug: 'gula-darah', judul: 'Cek gula darah rutin: perlu atau tidak?', ringkas: 'Siapa yang perlu memeriksa gula darah secara berkala dan bagaimana persiapannya.', tanggal: '18 Oktober 2026' },
]

export const faq = [
  { q: 'Apakah saya harus mendaftar online?', a: 'Tidak wajib. Pasien bisa datang langsung dan didaftarkan perawat, tetapi pendaftaran online membuat waktu tunggu lebih singkat.' },
  { q: 'Apakah menerima BPJS atau asuransi?', a: 'Saat ini pembayaran dilakukan tunai, transfer, atau QRIS. Kami menyediakan kuitansi untuk klaim asuransi pribadi.' },
  { q: 'Bagaimana cara membatalkan antrian?', a: 'Buka dashboard pasien, pilih kunjungan aktif, lalu tekan Batalkan antrian paling lambat 1 jam sebelum jadwal.' },
  { q: 'Apakah data rekam medis saya aman?', a: 'Rekam medis hanya bisa dibuka oleh Anda dan tenaga medis yang menangani Anda. Setiap akses tercatat di audit log.' },
  { q: 'Berapa lama resep diproses?', a: 'Rata-rata 10–15 menit setelah dokter menyimpan resep.' },
]
