// Menu per role. Setiap modul dibangun pada bab yang tertulis di `bab`.
const m = (label, slug, bab) => ({ label, slug, bab })

export const ROLES = {
  super_admin: { slug: 'super_admin', label: 'Super Admin', path: '/super-admin', menu: [
    m('Manajemen akun', 'akun', 'BAB 5'), m('Manajemen role', 'role', 'BAB 5'), m('Permission', 'permission', 'BAB 5'),
    m('Klinik', 'klinik', 'BAB 5'), m('Monitoring aktivitas', 'aktivitas', 'BAB 5'), m('Audit log', 'audit', 'BAB 5'), m('Pengaturan sistem', 'pengaturan', 'BAB 5')] },
  admin_klinik: { slug: 'admin_klinik', label: 'Admin Klinik', path: '/admin', menu: [
    m('Pasien', 'pasien', 'BAB 6'), m('Dokter', 'dokter', 'BAB 6'), m('Perawat & apoteker', 'staf', 'BAB 6'), m('Poli', 'poli', 'BAB 6'),
    m('Jadwal', 'jadwal', 'BAB 6'), m('Layanan & tarif', 'layanan', 'BAB 6'), m('Ruang periksa', 'ruang', 'BAB 10'), m('Antrian', 'antrian', 'BAB 12'),
    m('Pembayaran & invoice', 'pembayaran', 'BAB 15'), m('Laporan', 'laporan', 'BAB 17'), m('Pengaturan klinik', 'pengaturan', 'BAB 6')] },
  pemilik: { slug: 'pemilik', label: 'Pemilik Klinik', path: '/pemilik', menu: [
    m('Pendapatan & pengeluaran', 'keuangan', 'BAB 7'), m('Kinerja dokter & poli', 'kinerja', 'BAB 7'),
    m('Grafik kunjungan', 'grafik', 'BAB 7'), m('Monitoring operasional', 'monitoring', 'BAB 7'), m('Laporan', 'laporan', 'BAB 17')] },
  dokter: { slug: 'dokter', label: 'Dokter', path: '/dokter', menu: [
    m('Jadwal saya', 'jadwal', 'BAB 9'), m('Antrian & pemanggilan', 'antrian', 'BAB 12'), m('Pemeriksaan', 'pemeriksaan', 'BAB 9'),
    m('Rekam medis', 'rekam-medis', 'BAB 13'), m('Resep', 'resep', 'BAB 9'), m('Surat sakit & kontrol', 'surat', 'BAB 9'), m('Riwayat', 'riwayat', 'BAB 9')] },
  perawat: { slug: 'perawat', label: 'Perawat', path: '/perawat', menu: [
    m('Pendaftaran langsung', 'pendaftaran', 'BAB 10'), m('Verifikasi pasien', 'verifikasi', 'BAB 10'), m('Antrian & status', 'antrian', 'BAB 10'),
    m('Tanda vital', 'tanda-vital', 'BAB 10'), m('Ruang & tindakan', 'ruang', 'BAB 10')] },
  apoteker: { slug: 'apoteker', label: 'Apoteker', path: '/apoteker', menu: [
    m('Resep masuk', 'resep', 'BAB 11'), m('Data obat', 'obat', 'BAB 11'), m('Kategori obat', 'kategori', 'BAB 11'), m('Stok & batch', 'stok', 'BAB 11'),
    m('Kedaluwarsa & peringatan', 'kedaluwarsa', 'BAB 11'), m('Riwayat obat', 'riwayat', 'BAB 11')] },
  pasien: { slug: 'pasien', label: 'Pasien', path: '/pasien', menu: [
    m('Daftar online', 'daftar', 'BAB 8'), m('Nomor antrian', 'antrian', 'BAB 8'), m('Riwayat & hasil', 'riwayat', 'BAB 8'),
    m('Resep obat', 'resep', 'BAB 8'), m('Pembayaran & invoice', 'pembayaran', 'BAB 8'), m('Notifikasi', 'notifikasi', 'BAB 8'),
    m('Ulasan', 'ulasan', 'BAB 8'), m('Data diri', 'data-diri', 'BAB 8')] },
}
