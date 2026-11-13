# KlinikSehat

Aplikasi manajemen klinik rawat jalan: pendaftaran online, antrian, pemeriksaan, rekam medis, resep, apotek, pembayaran, laporan.
Teknologi: React + Vite + Tailwind CSS, Laravel 12 (REST API), PostgreSQL, Laravel Sanctum. Bahasa antarmuka: Indonesia.

- **Panduan pemasangan dan penggunaan lengkap:** `docs/03-panduan-lengkap.md`
- Blueprint (arsitektur, ERD, API): `docs/01-blueprint.md`
- Daftar uji manual per bab: `docs/02-panduan-backend.md`
- Status pengerjaan: `PROGRESS.md`

Mulai cepat: buat database di pgAdmin 4, `backend/setup.ps1`, isi `DB_PASSWORD`, `php artisan migrate --seed`, `php artisan serve`; lalu di `frontend/`: `npm install`, `npm run dev`. Login: `admin@kliniksehat.test` / `Password123!`.
