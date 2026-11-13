# Panduan Lengkap KlinikSehat (BAB 19)

## 1. Memasang software (sekali saja)
| Software | Fungsi | Catatan |
|---|---|---|
| PostgreSQL 15+ dan pgAdmin 4 | database | catat password user `postgres` |
| PHP 8.2+ dan Composer 2 | backend Laravel 12 | paling mudah lewat Laragon Full |
| Ekstensi PHP | `pdo_pgsql`, `pgsql`, `zip`, `mbstring`, `openssl` | `zip` dipakai ekspor .xlsx. Aktifkan di `php.ini` dengan menghapus `;` di depan `extension=...` |
| Node.js 20+ | frontend React + Vite | |

Cek: `php -v`, `composer -V`, `node -v`, `php -m` (harus memuat pdo_pgsql dan zip).

## 2. Membuat database di pgAdmin 4
1. Buka pgAdmin 4, sambungkan ke server lokal.
2. Klik kanan **Databases** > **Create** > **Database…**
3. Isi nama (mis. `klinik_sehat`), owner `postgres`, **Save**.
4. Untuk pengujian otomatis buat satu lagi: `klinik_sehat_test` (jangan dicampur dengan data asli).
Melihat data: Databases > nama database > Schemas > public > Tables > klik kanan tabel > View/Edit Data > All Rows.

## 3. Memasang backend
Dari folder `backend/` (Windows: `.\setup.ps1`, Mac/Linux: `./setup.sh`). Jika PowerShell menolak skrip: `powershell -ExecutionPolicy Bypass -File .\setup.ps1`. Skrip mengunduh Laravel 12, memasang Sanctum, menyalin kode KlinikSehat, dan membuat `.env`.

## 4. Mengatur `.env` (`backend/klinik-api/.env`)
```
DB_DATABASE=klinik_sehat        # sama persis dengan nama di pgAdmin
DB_USERNAME=postgres
DB_PASSWORD=password_postgres_anda
APP_DEBUG=true                  # ubah ke false di server sungguhan
FRONTEND_URL=http://localhost:5173
```
`FRONTEND_URL` juga menjadi daftar alamat yang boleh memanggil API (CORS). Pisahkan dengan koma bila lebih dari satu (mis. alamat IP laptop untuk uji dari HP). Setelah mengubah `.env`: `php artisan config:clear`.

## 5. Migration dan seeder
```
cd backend/klinik-api
php artisan migrate --seed
```
Seeder membuat 7 role, permission, 9+ akun demo, data klinik, poli, dokter, jadwal, ruang, dan **data contoh** (±90 hari kunjungan, invoice, pembayaran, pengeluaran, obat, riwayat pasien demo). Data contoh hanya untuk pengembangan; kosongkan sebelum dipakai sungguhan (lihat bagian 12).
Menerapkan pembaruan kode di kemudian hari: `backend\update.ps1` (menyalin kode baru, migrate, bersihkan cache).

## 6. Menjalankan backend
```
cd backend/klinik-api
php artisan serve              # http://localhost:8000
php artisan schedule:work      # (terminal terpisah, opsional) pengingat jadwal dan peringatan stok tiap hari 18.00
```
Cek: buka `http://localhost:8000/api/v1/public/doctors` (harus muncul JSON).

## 7. Menjalankan frontend
```
cd frontend
copy .env.example .env         # Mac/Linux: cp
npm install
npm run dev                    # http://localhost:5173
```

## 8. Akun demo (password semua: `Password123!`)
| Role | Email | Masuk ke |
|---|---|---|
| Super Admin | superadmin@kliniksehat.test | /super-admin |
| Admin Klinik | admin@kliniksehat.test | /admin |
| Pemilik Klinik | pemilik@kliniksehat.test | /pemilik |
| Dokter | dokter@kliniksehat.test (dan bima@, citra@) | /dokter |
| Perawat | perawat@kliniksehat.test | /perawat |
| Apoteker | apoteker@kliniksehat.test | /apoteker |
| Pasien | pasien@kliniksehat.test (atau daftar sendiri di /daftar) | /pasien |
**Ganti atau hapus akun demo sebelum dipakai sungguhan.**

## 9. Cara menggunakan (alur harian klinik)
1. **Admin** menyiapkan poli, dokter, jadwal praktik, layanan/tarif, ruang, dan akun perawat/apoteker.
2. **Pasien** mendaftar online (poli > dokter > tanggal) dan mendapat nomor antrian; atau **perawat** mendaftarkan pasien yang datang langsung dan mencetak nomor. Layar antrian publik: `/antrian`.
3. **Perawat**: verifikasi identitas, input tanda vital (pasien jadi "menunggu dokter"), tempatkan di ruang.
4. **Dokter**: panggil, mulai periksa, isi anamnesis/diagnosa/tindakan/resep, selesaikan. Tagihan terbit otomatis. Surat sakit/kontrol bila perlu.
5. **Apoteker**: proses resep, siapkan obat (stok berkurang otomatis FEFO, biaya obat masuk tagihan), serahkan.
6. **Admin (kasir)**: catat pembayaran atau verifikasi pembayaran online, cetak struk.
7. **Pemilik/Admin**: pantau dashboard, laporan, ekspor Excel/PDF.
Status kunjungan: terdaftar > diverifikasi > menunggu dokter > diperiksa > selesai (atau batal).

## 10. Backup dan restore database
**Backup (pgAdmin):** klik kanan database > Backup… > Filename `klinik_sehat_YYYYMMDD.backup` > Format **Custom** > Backup.
**Backup (terminal):** `pg_dump -U postgres -F c -f klinik_sehat_20260101.backup klinik_sehat`
**Restore (pgAdmin):** buat database kosong baru > klik kanan > Restore… > pilih berkas > Restore.
**Restore (terminal):** `pg_restore -U postgres -d klinik_sehat_baru --clean --if-exists klinik_sehat_20260101.backup`
Jadwalkan backup harian (Windows Task Scheduler atau cron) dan simpan salinan di perangkat lain. Uji restore secara berkala.

## 11. Deployment (server sungguhan)
1. Server Linux dengan PHP 8.2 + ekstensi di atas, Nginx/Apache, PostgreSQL, Composer, Node.
2. Backend: salin `backend/klinik-api` ke server, `composer install --no-dev --optimize-autoloader`, buat `.env` produksi: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://api.contoh.id`, `FRONTEND_URL=https://klinik.contoh.id`, kredensial database. Lalu `php artisan key:generate`, `php artisan migrate --force`, `php artisan db:seed --class=DatabaseSeeder` hanya bila perlu data awal, `php artisan config:cache route:cache`. Arahkan web server ke folder `public/`.
3. Frontend: di `frontend/` buat `.env` berisi `VITE_API_URL=https://api.contoh.id/api/v1`, jalankan `npm run build`, sajikan folder `dist/` (Nginx: `try_files $uri /index.html;`).
4. Pasang HTTPS (Let's Encrypt). Data medis tidak boleh lewat HTTP biasa.
5. Cron untuk scheduler: `* * * * * cd /path/klinik-api && php artisan schedule:run >> /dev/null 2>&1`.
6. Hak akses folder: `storage/` dan `bootstrap/cache/` dapat ditulis web server.
7. Hapus/ganti akun demo, jangan jalankan seeder data contoh (DemoFinanceSeeder, DemoPasienSeeder).

## 12. Mengosongkan data contoh
Di pgAdmin > Query Tool (HANYA di database pengembangan):
```
TRUNCATE visits, queues, vital_signs, medical_records, diagnoses, procedures, medical_documents, record_revisions,
  prescriptions, prescription_items, invoices, invoice_items, payments, expenses, notifications, reviews,
  stock_movements, medicine_batches, medicines, medicine_categories, procedure_schedules, audit_logs RESTART IDENTITY CASCADE;
DELETE FROM patients WHERE nama LIKE 'Pasien Contoh%';
```

## 13. Pengujian otomatis
```
cd backend/klinik-api
php artisan test
```
Memakai database `klinik_sehat_test` (diatur di `phpunit.xml`). Mencakup: login 7 role, penolakan akses lintas role, nomor antrian berurutan tanpa ganda, pendaftaran ganda ditolak, FEFO + pembatalan bila stok kurang, pembayaran tidak boleh melebihi tagihan.

## 14. Keamanan yang diterapkan
- Kata sandi di-hash (bcrypt), minimal 8 karakter; login/daftar/reset dibatasi 5–10 percobaan per menit.
- Token Sanctum berlaku 12 jam, dicabut saat logout/nonaktif/ganti password; sesi habis otomatis kembali ke halaman login.
- Pembatasan akses di dua lapis: rute frontend per role dan middleware `role` di setiap grup API (403 bila salah role). Pasien/dokter hanya dapat membuka data miliknya (404 untuk data orang lain).
- Validasi semua input di backend; query lewat Eloquent (terlindung dari SQL injection); React meng-escape tampilan; dokumen cetak meng-escape HTML; ekspor CSV mencegah formula injection.
- CORS hanya untuk `FRONTEND_URL`; header keamanan (nosniff, frame deny, no-store); batas 240 permintaan/menit per pengguna.
- Audit log untuk login/logout dan perubahan penting (akun, tarif, stok, pembayaran, ekspor).
- Transaksi dan penguncian baris pada nomor antrian, stok FEFO, dan pembayaran untuk mencegah ganda/selisih.

## 15. Mengatasi error
| Gejala | Penyebab / solusi |
|---|---|
| `setup.ps1 is not recognized` | Anda tidak berada di folder `backend`. `cd backend` lalu jalankan lagi. |
| `running scripts is disabled` | `powershell -ExecutionPolicy Bypass -File .\setup.ps1` |
| `could not find driver` | Aktifkan `pdo_pgsql` dan `pgsql` di php.ini, restart terminal. |
| `password authentication failed` | `DB_PASSWORD` di `.env` salah, lalu `php artisan config:clear`. |
| `relation "users" already exists` | Database sudah berisi tabel lain. Pakai database baru yang kosong. |
| `Could not open input file: artisan` | Anda tidak di folder `klinik-api`. |
| Login: "Email atau password salah" | Password demo: `Password123!` (P besar, tanda seru). |
| "Tidak dapat terhubung ke server" | `php artisan serve` belum jalan, atau `VITE_API_URL` salah. |
| Error CORS di konsol browser | Tambahkan alamat frontend ke `FRONTEND_URL`, `php artisan config:clear`. |
| Ekspor .xlsx: "ekstensi zip belum aktif" | Aktifkan `extension=zip` di php.ini, atau pakai ekspor CSV. |
| Tampilan polos tanpa warna | Ctrl+0 (reset zoom), restart `npm run dev`, Ctrl+F5. |
| Slot tanggal pendaftaran kosong | Dokter belum punya jadwal aktif (Admin > Jadwal). |
| `Route [..] not defined` / 404 setelah update | `php artisan route:clear` dan `config:clear`. |
| Setelah update muncul kolom/tabel tidak ada | `php artisan migrate`. |
