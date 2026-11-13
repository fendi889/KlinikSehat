<?php

namespace Tests\Feature;

use App\Models\Doctor;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\MedicalRecord;
use App\Models\Medicine;
use App\Models\MedicineBatch;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Visit;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Jalankan: php artisan test  (database: klinik_sehat_test) */
class KlinikSehatTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function masuk(string $email): static
    {
        $this->app['auth']->forgetGuards(); // token berganti antar-pengguna dalam satu pengujian
        $token = $this->postJson('/api/v1/auth/login', ['email' => $email, 'password' => 'Password123!'])->assertOk()->json('token');
        $this->app['auth']->forgetGuards();
        return $this->withToken($token);
    }

    public function test_semua_role_login_ke_dashboard_masing_masing(): void
    {
        foreach (['superadmin' => '/super-admin', 'admin' => '/admin', 'pemilik' => '/pemilik', 'dokter' => '/dokter', 'perawat' => '/perawat', 'apoteker' => '/apoteker', 'pasien' => '/pasien'] as $u => $path) {
            $this->postJson('/api/v1/auth/login', ['email' => "$u@kliniksehat.test", 'password' => 'Password123!'])->assertOk()->assertJsonPath('user.dashboard', $path);
        }
    }

    public function test_password_salah_ditolak(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => 'admin@kliniksehat.test', 'password' => 'salah'])->assertStatus(422);
    }

    public function test_akses_lintas_role_ditolak(): void
    {
        $this->getJson('/api/v1/dashboard/summary')->assertStatus(401);
        $this->masuk('pasien@kliniksehat.test')->getJson('/api/v1/admin/patients')->assertForbidden();
        $this->masuk('pasien@kliniksehat.test')->getJson('/api/v1/super-admin/users')->assertForbidden();
        $this->masuk('dokter@kliniksehat.test')->getJson('/api/v1/apoteker/medicines')->assertForbidden();
        $this->masuk('perawat@kliniksehat.test')->getJson('/api/v1/laporan')->assertForbidden();
        $this->masuk('pemilik@kliniksehat.test')->getJson('/api/v1/laporan/pasien')->assertForbidden();
    }

    public function test_nomor_antrian_berurutan_tanpa_ganda_dan_tanpa_pendaftaran_ganda(): void
    {
        $doc = Doctor::whereHas('user', fn ($q) => $q->where('email', 'dokter@kliniksehat.test'))->firstOrFail();
        $tgl = collect(range(0, 13))->map(fn ($i) => today()->addDays($i))->first(fn ($d) => $doc->schedules()->where('hari', $d->dayOfWeekIso)->exists());
        $kode = [];
        foreach ([1, 2, 3] as $i) {
            $p = Patient::create(['no_rm' => "RM-T-$i", 'nama' => "Uji $i"]);
            $kode[] = $this->masuk('perawat@kliniksehat.test')->postJson('/api/v1/perawat/visits', ['patient_id' => $p->id, 'doctor_id' => $doc->id, 'tanggal' => $tgl->toDateString()])->assertCreated()->json('kode');
        }
        $this->assertSame(['U-001', 'U-002', 'U-003'], $kode);
        $this->masuk('perawat@kliniksehat.test')->postJson('/api/v1/perawat/visits', ['patient_id' => Patient::where('no_rm', 'RM-T-1')->value('id'), 'doctor_id' => $doc->id, 'tanggal' => $tgl->toDateString()])->assertStatus(422);
    }

    private function resep(int $jumlah, Medicine $m): Prescription
    {
        $doc = Doctor::firstOrFail();
        $p = Patient::create(['no_rm' => 'RM-R-'.uniqid(), 'nama' => 'Pasien Resep']);
        $v = Visit::create(['patient_id' => $p->id, 'doctor_id' => $doc->id, 'poli_id' => $doc->poli_id, 'tanggal' => today()->toDateString(), 'status' => 'selesai']);
        $mr = MedicalRecord::create(['visit_id' => $v->id, 'patient_id' => $p->id, 'doctor_id' => $doc->id]);
        $rx = Prescription::create(['medical_record_id' => $mr->id, 'status' => 'diproses']);
        PrescriptionItem::create(['prescription_id' => $rx->id, 'medicine_id' => $m->id, 'jumlah' => $jumlah, 'aturan_pakai' => '3x1']);
        Invoice::create(['nomor' => 'INV-T-'.$v->id, 'visit_id' => $v->id, 'patient_id' => $p->id, 'status' => 'belum_bayar']);
        return $rx;
    }

    public function test_fefo_memakai_batch_kedaluwarsa_terdekat_dan_batal_jika_stok_kurang(): void
    {
        $m = Medicine::create(['kode' => 'UJI-1', 'nama' => 'Obat Uji', 'satuan' => 'tablet', 'harga_jual' => 1000, 'stok_minimum' => 1]);
        $a = MedicineBatch::create(['medicine_id' => $m->id, 'no_batch' => 'A', 'tgl_kedaluwarsa' => today()->addDays(30), 'stok' => 10, 'harga_beli' => 500]);
        $b = MedicineBatch::create(['medicine_id' => $m->id, 'no_batch' => 'B', 'tgl_kedaluwarsa' => today()->addDays(300), 'stok' => 10, 'harga_beli' => 500]);

        $rx = $this->resep(15, $m);
        $this->masuk('apoteker@kliniksehat.test')->postJson("/api/v1/apoteker/prescriptions/{$rx->id}/ready")->assertOk();
        $this->assertSame(0, $a->fresh()->stok);   // batch terdekat habis lebih dulu
        $this->assertSame(5, $b->fresh()->stok);

        $rx2 = $this->resep(100, $m);
        $this->masuk('apoteker@kliniksehat.test')->postJson("/api/v1/apoteker/prescriptions/{$rx2->id}/ready")->assertStatus(422);
        $this->assertSame(5, $b->fresh()->stok);   // tidak ada perubahan setengah jalan
        $this->assertSame('diproses', $rx2->fresh()->status);
    }

    public function test_pembayaran_tidak_boleh_melebihi_tagihan_dan_menjadi_lunas(): void
    {
        $m = Medicine::create(['kode' => 'UJI-2', 'nama' => 'Obat Bayar', 'satuan' => 'tablet', 'harga_jual' => 1000, 'stok_minimum' => 1]);
        $inv = Invoice::find($this->resep(1, $m)->medicalRecord->visit->invoice->id);
        InvoiceItem::create(['invoice_id' => $inv->id, 'deskripsi' => 'Konsultasi', 'qty' => 1, 'harga' => 100000]);
        $inv->recalc();

        $this->masuk('admin@kliniksehat.test')->postJson("/api/v1/admin/invoices/{$inv->id}/payments", ['jumlah' => 150000, 'metode' => 'tunai'])->assertStatus(422);
        $this->masuk('admin@kliniksehat.test')->postJson("/api/v1/admin/invoices/{$inv->id}/payments", ['jumlah' => 60000, 'metode' => 'tunai'])->assertOk()->assertJsonPath('status', 'belum_bayar');
        $this->masuk('admin@kliniksehat.test')->postJson("/api/v1/admin/invoices/{$inv->id}/payments", ['jumlah' => 40000, 'metode' => 'qris'])->assertOk()->assertJsonPath('status', 'lunas');
    }
}
