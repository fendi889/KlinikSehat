# Panduan Backend (BAB 3 & 4)

## 1. Prasyarat
PHP 8.2+ (ekstensi pdo_pgsql, pgsql, mbstring, openssl), Composer 2, PostgreSQL 15+, pgAdmin 4, Node.js 20+.

## 2. Buat database di pgAdmin 4
1. Buka pgAdmin 4 dan sambungkan ke server PostgreSQL lokal.
2. Klik kanan **Databases** > **Create** > **Database…**
3. Isi nama `klinik_sehat`, owner `postgres`, lalu **Save**.

## 3. Pasang Laravel 12 + kode KlinikSehat
Dari folder `backend/`:
- Linux/macOS: `./setup.sh`
- Windows (PowerShell): `.\setup.ps1`

Skrip membuat proyek `backend/klinik-api` (Laravel 12), memasang Sanctum, menyalin kode dari `overlay/`, dan membuat `.env`.

## 4. Atur .env
Buka `backend/klinik-api/.env`, ganti `DB_PASSWORD` dengan password PostgreSQL Anda. Pengaturan lain sudah terisi (DB_DATABASE=klinik_sehat, APP_LOCALE=id, MAIL_MAILER=log).

## 5. Migration, seeder, jalankan
```
cd backend/klinik-api
php artisan migrate --seed
php artisan serve
```
API: http://localhost:8000/api/v1 . Segarkan database di pgAdmin 4 untuk melihat tabel.

## 6. Jalankan frontend
```
cd frontend
copy .env.example .env      (Linux/macOS: cp .env.example .env)
npm install
npm run dev
```

## 7. Akun demo (password semua: `Password123!`)
| Role | Email |
|---|---|
| Super Admin | superadmin@kliniksehat.test |
| Admin Klinik | admin@kliniksehat.test |
| Pemilik Klinik | pemilik@kliniksehat.test |
| Dokter | dokter@kliniksehat.test |
| Perawat | perawat@kliniksehat.test |
| Apoteker | apoteker@kliniksehat.test |
| Pasien | pasien@kliniksehat.test |

Akun ini hanya untuk pengembangan. Hapus atau ganti passwordnya sebelum dipakai sungguhan.

## 8. Lupa password
Email dikirim ke log (MAIL_MAILER=log). Buka `storage/logs/laravel.log`, salin tautan reset yang mengarah ke `http://localhost:5173/reset-password?...`.

## 9. Pengujian manual yang perlu dilakukan
1. Login dengan 7 akun: tiap akun harus masuk ke dashboard role-nya.
2. Saat login sebagai Pasien, ketik `/admin` di URL: harus dialihkan ke `/pasien`.
3. Dengan token Pasien, `GET /api/v1/admin/ping` harus 403.
4. Registrasi pasien baru, logout, login ulang.
5. Ubah password dan profil.
6. `POST /api/v1/queues` dua kali untuk poli dan tanggal sama: nomor harus U-001, U-002 (tanpa ganda).

## 10. Mengatasi error
- `could not find driver`: aktifkan `pdo_pgsql` di php.ini.
- `password authentication failed`: periksa DB_PASSWORD.
- Frontend "Tidak dapat terhubung ke server": pastikan `php artisan serve` berjalan dan VITE_API_URL benar.

## 11. Uji BAB 5 (Super Admin)
Login sebagai superadmin@kliniksehat.test, lalu:
1. Akun: tambah akun Perawat, ubah nama, nonaktifkan lalu coba login akun itu (harus ditolak), hapus.
2. Tambah akun Dokter tanpa memilih poli: harus muncul pesan error.
3. Permission: centang/ubah untuk Apoteker, simpan, muat ulang halaman (centang harus tetap).
4. Klinik dan Pengaturan: ubah, simpan, muat ulang.
5. Audit log: harus ada catatan `login`, `akun.buat`, dll. Monitoring aktivitas menampilkan angka.
6. Login sebagai Admin Klinik lalu buka `/super-admin`: harus dialihkan; `GET /api/v1/super-admin/users` dengan token Admin harus 403.

## 12. Uji BAB 6 (Admin Klinik)
Login admin@kliniksehat.test, lalu:
1. Poli: tambah poli kode `T`; coba kode yang sama lagi (harus ditolak); hapus poli yang sudah punya dokter (harus 409).
2. Dokter: tambah dokter baru, lalu login dengan email itu (harus masuk dashboard Dokter).
3. Jadwal: tambah jadwal dokter hari Senin 08:00–12:00, lalu 10:00–14:00 untuk dokter dan hari sama (harus ditolak bentrok).
4. Pasien: tambah, cari berdasarkan nama atau No. RM, ubah, hapus.
5. Layanan: ubah tarif lalu cek Audit log di akun Super Admin (`layanan.ubah`).
6. Perawat/apoteker: tambah, nonaktifkan, login akun itu (harus ditolak).
7. Login sebagai Dokter: `GET /api/v1/admin/patients` harus 403.

## 13. Uji BAB 7 (Pemilik)
Agar grafik terisi, muat data contoh (sekali saja, di folder klinik-api):
```
php artisan db:seed --class=DemoFinanceSeeder
```
Seeder berhenti sendiri jika data invoice sudah ada. Data berisi ±90 hari kunjungan, invoice, pembayaran, pengeluaran, dan 3 obat contoh. Hanya untuk pengembangan.

Login pemilik@kliniksehat.test (Password123!):
1. Pendapatan & pengeluaran: angka muncul, ubah rentang tanggal, angka berubah. Tambah pengeluaran, lalu muat ulang halaman; angka pengeluaran bertambah.
2. Kinerja: tabel dokter dan poli terisi.
3. Grafik: tombol 7/30/90 hari mengubah grafik.
4. Monitoring: ada stok rendah (Amoxicillin) dan obat segera kedaluwarsa (Vitamin C).
5. Login sebagai Admin lalu `GET /api/v1/pemilik/finance` harus 403.

## 14. Uji BAB 8 (Pasien)
Muat riwayat contoh (sekali): `php artisan db:seed --class=DemoPasienSeeder` (memerlukan DemoFinanceSeeder sudah dijalankan agar ada obat).
Login pasien@kliniksehat.test (Password123!):
1. Daftar online: pilih poli > dokter > tanggal > Ambil nomor antrian. Nomor muncul (mis. U-001). Daftar lagi ke dokter+tanggal yang sama: harus ditolak.
2. Nomor antrian: kartu muncul, ada tombol Batalkan. Login sebagai Perawat/Admin di jendela lain: `POST /api/v1/queues/{id}/call` mengubah status jadi Dipanggil dan halaman pasien ikut berubah dalam 5 detik.
3. Riwayat: klik kunjungan untuk melihat tanda vital, diagnosa, resep, tagihan.
4. Resep, Pembayaran, Notifikasi (ada "Pendaftaran berhasil"), Ulasan (beri ulasan, lalu tidak bisa ulas dua kali), Data diri (ubah dan simpan).
5. Atur Jadwal dokter di Admin; slot tanggal pada pendaftaran harus mengikuti jadwal itu. Super Admin > Pengaturan > Pendaftaran online "Ditutup": pendaftaran pasien harus ditolak.
6. Pasien membuka `/api/v1/admin/patients`: 403. Pasien A tidak boleh membuka kunjungan pasien B (404).

## 15. Uji BAB 9 (Dokter)
Jalankan migration baru: `php artisan migrate` (menambah kolom `isi` pada medical_documents).
Alur uji terpadu (butuh 2 jendela browser/profil: pasien dan dokter):
1. Pasien (pasien@...) daftar online ke dokter@kliniksehat.test (dr. Anisa, Poli Umum) pada hari praktiknya. Tambahkan jadwal hari ini lewat Admin jika perlu.
2. Dokter (dokter@kliniksehat.test): menu Antrian > pasien muncul > Panggil. Di dashboard pasien, status berubah jadi "Dipanggil" (maks. 5 dtk).
3. Dokter: Mulai periksa. Isi tanda vital, diagnosa, tindakan, Simpan pemeriksaan. Cari obat (mis. "para"), tambah ke resep, Simpan resep. Coba obat yang menyebut alergi pasien: peringatan muncul.
4. Selesaikan pemeriksaan tanpa diagnosa: harus ditolak. Isi diagnosa lalu selesaikan: kembali ke antrian, tagihan dibuat.
5. Surat sakit / jadwal kontrol: buat, lalu Cetak. Pasien menerima notifikasi.
6. Pasien: Riwayat menampilkan hasil, Resep menampilkan resep, Pembayaran menampilkan invoice "Belum bayar".
7. Dokter lain tidak boleh membuka kunjungan dokter ini (404). Dokter yang memanggil `/api/v1/admin/patients`: 403.

## 16. Uji BAB 10 (Perawat)
Jalankan: `php artisan migrate` lalu `php artisan db:seed --class=RoomSeeder` (membuat ruang per poli + Ruang Tindakan).
Login perawat@kliniksehat.test (Password123!):
1. Pendaftaran langsung: cari pasien "Pasien Demo", pilih poli > dokter > tanggal (dokter harus punya jadwal), daftarkan. Nomor muncul, klik Cetak. Daftarkan pasien yang sama ke dokter dan tanggal sama: harus ditolak.
2. Klik "+ Pasien baru", isi nama, simpan, lalu daftarkan. NIK yang sama dua kali harus ditolak.
3. Antrian & status: kartu ringkasan berubah. Panggil pasien (pasien yang punya akun melihat status "Dipanggil" di dashboard-nya).
4. Verifikasi: centang identitas lalu Verifikasi; statusnya jadi "Diverifikasi".
5. Tanda vital: isi angka wajar, simpan; status menjadi "Menunggu dokter". Isi suhu 99: harus ditolak.
6. Dokter (akun lain) membuka antrian: pasien yang tanda vitalnya diisi perawat muncul dengan keterangan "tanda vital sudah diinput", dan angka tampil di form pemeriksaan.
7. Ruang: tempatkan pasien di ruang; pasien lain ke ruang yang sama harus ditolak. Admin: menu Ruang periksa dapat menambah/mengubah ruang.
8. Jadwal tindakan: buat, tandai selesai.
9. Perawat membuka `/api/v1/admin/patients`: 403.

Catatan alur status kunjungan: terdaftar > diverifikasi > menunggu_dokter (setelah tanda vital) > diperiksa > selesai.

## 17. Uji BAB 11 (Apoteker)
Tidak ada migration baru. Pastikan data contoh obat ada (`php artisan db:seed --class=DemoFinanceSeeder`, bila belum).
Login apoteker@kliniksehat.test (Password123!):
1. Data obat: tambah obat "Ibuprofen 400 mg" (kode IBU-400, satuan tablet), cari, ubah harga. Kode yang sama dua kali harus ditolak. Hapus obat yang punya stok: harus ditolak.
2. Kategori obat: tambah "Antibiotik", hubungkan ke obat lewat Data obat > Ubah.
3. Stok & batch > Stok masuk: pilih obat, batch B-001, kedaluwarsa tahun depan, jumlah 100. Ulangi batch yang sama dengan tanggal berbeda: harus ditolak. Tanggal kedaluwarsa kemarin: harus ditolak.
4. Sesuaikan: stok keluar 5 (alasan "rusak"), lalu keluar 9999: harus ditolak. Tanpa alasan: harus ditolak.
5. Uji FEFO: buat dua batch obat yang sama (A kedaluwarsa 3 bulan lagi, B 1 tahun lagi). Dokter menulis resep obat itu (alur BAB 9). Apoteker: Proses resep > Siapkan obat. Cek Stok & batch: yang berkurang batch A lebih dulu. Cek Riwayat obat: tercatat "Resep #... (FEFO)".
6. Resep dengan jumlah melebihi stok: tombol Siapkan obat nonaktif dan tertulis stok kurang.
7. Pasien: menerima notifikasi "Obat siap diambil" dan invoice-nya memuat baris "Obat (resep #...)".
8. Kedaluwarsa & peringatan: tampil batch Vitamin C (≤30 hari) dan stok rendah Amoxicillin dari data contoh.
9. Ekspor Excel (CSV): klik di Data obat, Stok & batch, dan Riwayat obat. Buka di Excel: kolom terpisah rapi dan huruf Indonesia benar.
10. Akun Dokter memanggil `/api/v1/apoteker/medicines`: 403.

## 18. Uji BAB 12 (Antrian) dan BAB 15 (Pembayaran)
Tidak ada migration baru.
**Antrian**
1. Buka `http://localhost:5173/antrian` (tanpa login) di tab terpisah: papan menampilkan tiap poli, nomor yang dipanggil, dan 5 nomor berikutnya tanpa nama pasien.
2. Daftarkan 3 pasien ke poli yang sama; nomor harus berurutan (U-001, U-002, U-003) tanpa ganda.
3. Perawat/Admin > Antrian: Panggil U-001 (papan publik ikut berubah dalam 5 detik), Lewati U-002 (status Terlewat; pasien melihat peringatan), Masukkan kembali, Batalkan U-003.
4. Admin > Antrian memiliki tombol yang sama; tombol Verifikasi dan Tanda vital hanya untuk perawat.
**Pembayaran**
5. Setelah dokter menyelesaikan pemeriksaan dan apoteker menyiapkan obat, Admin > Pembayaran & invoice > Buka: ada baris Konsultasi dan Obat. Tambah item, beri diskon; ubah diskon melebihi subtotal: harus ditolak.
6. Catat pembayaran tunai sebagian, lalu sisanya: status menjadi Lunas. Bayar melebihi sisa: harus ditolak. Setelah ada pembayaran, item/diskon terkunci.
7. Pasien: Pembayaran > Bayar online (transfer, isi referensi). Admin melihat "perlu verifikasi" > Terima. Pasien menerima notifikasi. Coba Tolak untuk pembayaran lain: status Ditolak, tagihan tetap belum lunas.
8. Cetak invoice dan struk: di dialog cetak browser pilih "Simpan sebagai PDF".
9. Riwayat transaksi: filter tanggal/status, total terverifikasi tampil.
10. Pasien membuka `/api/v1/admin/invoices`: 403. Pasien A membayar invoice pasien B: 404.

## 19. Uji redesain tampilan
Setelah menimpa file: `backend\update.ps1` (menambah endpoint overview), restart `php artisan serve`, lalu di frontend `npm run dev` dan Ctrl+F5 (tidak ada paket baru).
1. Beranda `/`: navbar (klik tiap menu, menu aktif berubah saat menggulir), tombol Daftar Sekarang (ke /daftar), Pelajari Lebih Lanjut (menggulir ke Tentang). Form antrian: pilih poli + tanggal > Daftar Sekarang. Belum login: diarahkan ke login lalu ke halaman pendaftaran pasien dengan poli terpilih; login non-pasien: muncul pesan.
2. Persempit jendela browser/HP: menu hamburger membuka panel, hero menumpuk ke bawah, form tetap terbaca.
3. Login `/login`: dua kolom, ikon mata menampilkan/menyembunyikan password, "Ingat saya" (matikan: tutup browser lalu buka lagi harus login ulang), Lupa Password, Kembali ke Beranda.
4. Login pemilik: kartu statistik, grafik (ganti 30 Hari/6 Bulan/12 Bulan), kartu Antrian Saat Ini, tombol Lihat Semua Antrian (ke /antrian), pintasan, menu profil di kanan atas (Profil, Ubah password, Keluar), lonceng.
5. Login role lain: sidebar berikon sesuai menu, semua halaman lama tetap bisa dibuka.
