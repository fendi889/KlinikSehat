# PROGRESS KlinikSehat
- [x] BAB 1 Blueprint (docs/01-blueprint.md)
- [x] BAB 2 Landing page (frontend)
- [x] BAB 3 Autentikasi frontend: login, daftar, lupa/reset password, profil, ubah password, rute terproteksi per role
- [x] BAB 4 Backend: migration (4 file, 40+ tabel), model, QueueService, controller Auth/Public/Dashboard/Queue, middleware role, routes, seeder 7 role + akun demo
- [x] BAB 5 Dashboard Super Admin: akun (CRUD+nonaktif), role, permission (matriks), klinik, aktivitas, audit log, pengaturan (kode ditulis, BELUM diuji)
- [x] BAB 6 Dashboard Admin Klinik: pasien, dokter, perawat/apoteker, poli, jadwal (anti-bentrok), layanan & tarif, pengaturan klinik (BELUM diuji). Antrian/pembayaran/laporan admin menyusul di BAB 12/15/17.
- [x] BAB 7 Dashboard Pemilik: keuangan + catatan pengeluaran, kinerja dokter/poli, grafik kunjungan & pendapatan, monitoring operasional, seeder data contoh (BELUM diuji; laporan menyusul BAB 17)
- [x] BAB 8 Dashboard Pasien: daftar online (poli>dokter>tanggal, cek kuota/duplikat), antrian langsung (polling 5 dtk, batal), riwayat+hasil, resep, invoice (lihat), notifikasi, ulasan, data diri (BELUM diuji). Bayar online -> BAB 15.
- [x] BAB 9 Dashboard Dokter: jadwal, antrian+panggil, form pemeriksaan (tanda vital, anamnesis, diagnosa, tindakan, resep dgn peringatan alergi/stok), selesai -> invoice otomatis, surat sakit & kontrol (cetak), pasien/rekam medis, riwayat, riwayat perubahan (BELUM diuji)
- [x] BAB 10 Dashboard Perawat: pendaftaran langsung (cari/tambah pasien, cetak nomor), verifikasi, antrian+status, tanda vital, ruang pemeriksaan, jadwal tindakan; admin: ruang periksa (BELUM diuji)
- [x] BAB 11 Dashboard Apoteker: resep masuk (proses > siapkan > serahkan), data obat, kategori, stok & batch (stok masuk, keluar/koreksi), FEFO otomatis, biaya obat masuk invoice, kedaluwarsa & stok rendah, riwayat obat, ekspor CSV/Excel (BELUM diuji). Mencakup sebagian besar BAB 14 (tinggal laporan obat di BAB 17).
- [x] BAB 12 Sistem antrian: nomor otomatis per poli/tanggal tanpa ganda (kunci + unique), panggil, lewati/terlewat, masukkan kembali, batalkan, antrian di Admin, layar antrian publik /antrian (polling 5 dtk) (BELUM diuji)
- [x] BAB 13 Rekam medis: sebagian besar sudah di BAB 9 (keluhan, riwayat, alergi, tanda vital, diagnosa, tindakan, resep, catatan) + riwayat perubahan (dilihat di Riwayat dokter). BELUM ADA: unggah dokumen medis (file).
- [x] BAB 14 Apotek & stok: tercakup di BAB 11 (laporan obat menyusul di BAB 17)
- [x] BAB 15 Pembayaran & invoice: invoice otomatis, item/diskon, kasir catat bayar, bayar online pasien + verifikasi, struk/invoice cetak (simpan PDF lewat dialog cetak), riwayat transaksi (BELUM diuji)
- [x] BAB 16 Notifikasi: lonceng + halaman notifikasi untuk semua role, pendaftaran/panggilan/hasil/resep/pembayaran/stok, pengingat jadwal besok (perintah `kliniksehat:notifikasi-harian`, terjadwal 18.00) (BELUM diuji)
- [x] BAB 17 Laporan & ekspor: 8 laporan (pasien, dokter, kunjungan, poli, obat, pembayaran, pendapatan, pengeluaran), ekspor .xlsx asli + CSV + cetak/simpan PDF; pemilik tidak melihat nama pasien (BELUM diuji)
- [x] BAB 18 Pengujian & keamanan: pemeriksaan statis otomatis (rute->metode, model, kurung, impor, menu->halaman) = 0 temuan; pengujian otomatis `php artisan test` ditulis (BELUM dijalankan); penguatan keamanan (token 12 jam, CORS, throttle, header)
- [x] BAB 19 Dokumentasi: docs/03-panduan-lengkap.md
- [x] BAB 20 Penyelesaian: semua kode tersedia. STATUS UJI: kode belum pernah dijalankan end-to-end; hanya login Admin + dashboard yang terbukti di komputer pengguna.

## Belum ada / keterbatasan yang diketahui
- Unggah dokumen medis (file hasil lab dll) belum ada.
- Pembayaran online memakai nomor referensi (tanpa gateway pembayaran/unggah bukti foto).
- PDF dibuat lewat dialog cetak browser ("Simpan sebagai PDF"), bukan dari server.
- Foto dokter belum bisa diunggah (avatar inisial). Landing page masih memakai data statis sebagian (statistik/dokter/jadwal belum dari API).
- Ekspor Apoteker berformat CSV; ekspor Laporan berformat .xlsx.
- Notifikasi hanya dalam aplikasi (tanpa email/WhatsApp/SMS).

## Langkah berikutnya
Jalankan pengujian menyeluruh (docs/02-panduan-backend.md bagian 9-18 dan `php artisan test`), kirim temuan error untuk diperbaiki.

## Redesain tampilan (permintaan pengguna)
- Tema baru biru-putih-biru muda, font Plus Jakarta Sans, ikon SVG sendiri (tanpa paket baru), animasi halus (hormati `prefers-reduced-motion`).
- Beranda: navbar modern + scroll-spy + menu HP, hero dengan ilustrasi gedung klinik, form "Daftar Nomor Antrian" (terhubung ke login/pendaftaran pasien dan memilih poli/tanggal otomatis), kartu info, seksi "Antrian hari ini" (data nyata, polling). Semua seksi lama dipertahankan.
- Login/Daftar/Lupa/Reset password: dua kolom (ilustrasi di kiri), tampil/sembunyi password, ingat saya (localStorage vs sessionStorage), lupa password, tombol Kembali ke Beranda.
- Dashboard (semua role): sidebar gelap berikon + drawer di HP, topbar dengan lonceng dan menu profil.
- Dashboard Pemilik: 4 kartu statistik dengan tren, grafik kunjungan (30 hari/6 bulan/12 bulan), kartu antrian saat ini, pintasan. Endpoint baru: GET /api/v1/pemilik/overview.
- Tidak diubah: database, API lain, autentikasi, algoritma. Tanpa tombol "Login dengan Google" (belum ada OAuth di backend).
- BELUM diuji di browser.
