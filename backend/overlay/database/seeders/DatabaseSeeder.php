<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\Faq;
use App\Models\Patient;
use App\Models\Permission;
use App\Models\Poli;
use App\Models\Role;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public const PASSWORD = 'Password123!'; // HANYA untuk demo/pengembangan

    public function run(): void
    {
        $roles = [
            'super_admin' => 'Super Admin', 'admin_klinik' => 'Admin Klinik', 'pemilik' => 'Pemilik Klinik',
            'dokter' => 'Dokter', 'perawat' => 'Perawat', 'apoteker' => 'Apoteker', 'pasien' => 'Pasien',
        ];
        foreach ($roles as $slug => $nama) Role::updateOrCreate(['slug' => $slug], ['nama' => $nama]);

        foreach (['akun', 'klinik', 'antrian', 'rekam_medis', 'resep', 'obat', 'pembayaran', 'laporan', 'audit'] as $m) {
            foreach (['lihat', 'kelola'] as $a) Permission::updateOrCreate(['slug' => "$m.$a"], ['nama' => ucfirst($a).' '.str_replace('_', ' ', $m), 'modul' => $m]);
        }
        $grant = [
            'super_admin' => Permission::pluck('id')->all(),
            'admin_klinik' => Permission::whereIn('modul', ['klinik', 'antrian', 'pembayaran', 'laporan'])->pluck('id')->all(),
            'pemilik' => Permission::where('slug', 'like', '%.lihat')->whereIn('modul', ['klinik', 'pembayaran', 'laporan'])->pluck('id')->all(),
            'dokter' => Permission::whereIn('modul', ['antrian', 'rekam_medis', 'resep'])->pluck('id')->all(),
            'perawat' => Permission::whereIn('modul', ['antrian', 'rekam_medis'])->pluck('id')->all(),
            'apoteker' => Permission::whereIn('modul', ['resep', 'obat'])->pluck('id')->all(),
            'pasien' => [],
        ];
        foreach ($grant as $slug => $ids) Role::where('slug', $slug)->first()->permissions()->sync($ids);

        $mk = fn (string $name, string $email, string $role, string $phone = '081200000000') => User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => self::PASSWORD, 'phone' => $phone, 'is_active' => true, 'role_id' => Role::where('slug', $role)->value('id')]
        );

        $mk('Super Admin', 'superadmin@kliniksehat.test', 'super_admin');
        $mk('Admin Klinik', 'admin@kliniksehat.test', 'admin_klinik');
        $mk('Pemilik Klinik', 'pemilik@kliniksehat.test', 'pemilik');
        $mk('Perawat Sari', 'perawat@kliniksehat.test', 'perawat');
        $mk('Apoteker Hadi', 'apoteker@kliniksehat.test', 'apoteker');
        foreach (['admin@kliniksehat.test' => 'Admin', 'perawat@kliniksehat.test' => 'Perawat', 'apoteker@kliniksehat.test' => 'Apoteker'] as $em => $jab) {
            Staff::updateOrCreate(['user_id' => User::where('email', $em)->value('id')], ['jabatan' => $jab]);
        }

        $pasien = $mk('Pasien Demo', 'pasien@kliniksehat.test', 'pasien');
        Patient::firstOrCreate(['user_id' => $pasien->id], [
            'no_rm' => Patient::nextRm(), 'nama' => 'Pasien Demo', 'tgl_lahir' => '1995-05-17', 'jenis_kelamin' => 'P',
        ]);

        $clinic = Clinic::firstOrCreate(['nama' => 'KlinikSehat'], [
            'alamat' => 'Jl. Kesehatan No. 25, Menteng, Jakarta Pusat', 'telp' => '(021) 5550 1234',
            'email' => 'halo@kliniksehat.id', 'jam_buka' => 'Senin–Sabtu 07.30–21.00',
        ]);

        $polis = [];
        foreach ([['Poli Umum', 'U'], ['Poli Gigi', 'G'], ['Poli Anak', 'A'], ['Poli Kandungan', 'K'], ['Poli Penyakit Dalam', 'D']] as [$n, $k]) {
            $polis[$n] = Poli::firstOrCreate(['clinic_id' => $clinic->id, 'kode' => $k], ['nama' => $n]);
        }

        $docs = [
            ['dr. Anisa Rahmawati', 'dokter@kliniksehat.test', 'Poli Umum', 9, [1, 3, 5]],
            ['drg. Bima Pratama', 'bima@kliniksehat.test', 'Poli Gigi', 7, [2, 4, 6]],
            ['dr. Citra Lestari, Sp.A', 'citra@kliniksehat.test', 'Poli Anak', 12, [1, 2, 4]],
        ];
        foreach ($docs as [$nama, $email, $poli, $thn, $hari]) {
            $u = $mk($nama, $email, 'dokter');
            $d = Doctor::firstOrCreate(['user_id' => $u->id], ['poli_id' => $polis[$poli]->id, 'pengalaman_tahun' => $thn]);
            if (!$d->schedules()->exists()) foreach ($hari as $h) Schedule::create(['doctor_id' => $d->id, 'hari' => $h, 'jam_mulai' => '08:00', 'jam_selesai' => '12:00', 'kuota' => 20]);
        }

        foreach ([['Konsultasi Dokter Umum', 'Poli Umum', 75000], ['Konsultasi Dokter Gigi', 'Poli Gigi', 120000], ['Konsultasi Dokter Anak', 'Poli Anak', 110000]] as [$n, $p, $t]) {
            Service::firstOrCreate(['nama' => $n], ['poli_id' => $polis[$p]->id, 'tarif' => $t, 'deskripsi' => $n]);
        }
        Article::firstOrCreate(['slug' => 'tekanan-darah-tinggi'], ['judul' => 'Tekanan darah tinggi: kapan harus ke dokter?', 'ringkas' => 'Kenali angka yang perlu diwaspadai.', 'isi' => 'Isi artikel contoh.', 'terbit_at' => now()]);
        Faq::firstOrCreate(['pertanyaan' => 'Apakah saya harus mendaftar online?'], ['jawaban' => 'Tidak wajib, tetapi pendaftaran online mempersingkat waktu tunggu.', 'urutan' => 1]);

        $this->call(RoomSeeder::class);
        if (!app()->environment('testing')) { // data contoh besar tidak dibutuhkan oleh pengujian otomatis
            $this->call(DemoFinanceSeeder::class);
            $this->call(DemoPasienSeeder::class);
        }
    }
}
