<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Medicine;
use App\Models\MedicineBatch;
use App\Models\MedicineCategory;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Queue;
use App\Models\Service;
use App\Models\Visit;
use Illuminate\Database\Seeder;

/** Data CONTOH untuk mengisi grafik dan laporan. Hanya untuk pengembangan. Jalankan: php artisan db:seed --class=DemoFinanceSeeder */
class DemoFinanceSeeder extends Seeder
{
    public function run(): void
    {
        if (Invoice::exists()) return; // jangan menimpa data yang sudah ada

        for ($i = 1; $i <= 12; $i++) {
            Patient::firstOrCreate(['nama' => "Pasien Contoh $i"], ['no_rm' => Patient::nextRm(), 'jenis_kelamin' => $i % 2 ? 'L' : 'P']);
        }
        $patients = Patient::pluck('id')->all();
        $doctors = Doctor::all();
        $tarif = Service::whereNotNull('poli_id')->pluck('tarif', 'poli_id');
        $queueNo = [];
        $mapAntrian = ['terdaftar' => 'menunggu', 'menunggu_dokter' => 'menunggu', 'diperiksa' => 'dilayani', 'selesai' => 'selesai'];
        mt_srand(2026);

        for ($off = 89; $off >= 0; $off--) {
            $day = now()->subDays($off);
            $n = $day->isSunday() ? mt_rand(0, 2) : mt_rand(3, 8);
            for ($k = 0; $k < $n; $k++) {
                $doc = $doctors->random();
                $status = $off === 0 ? ['terdaftar', 'menunggu_dokter', 'diperiksa', 'selesai'][mt_rand(0, 3)] : 'selesai';
                $visit = Visit::create([
                    'patient_id' => $patients[array_rand($patients)], 'doctor_id' => $doc->id, 'poli_id' => $doc->poli_id,
                    'tanggal' => $day->toDateString(), 'keluhan' => 'Data contoh', 'status' => $status,
                ]);
                if ($off === 0) {
                    $no = $queueNo[$doc->poli_id] = ($queueNo[$doc->poli_id] ?? 0) + 1;
                    Queue::create(['visit_id' => $visit->id, 'poli_id' => $doc->poli_id, 'tanggal' => $day->toDateString(), 'nomor' => $no,
                        'kode' => 'X-'.str_pad((string) $no, 3, '0', STR_PAD_LEFT), 'status' => $mapAntrian[$status]]);
                }
                if ($status !== 'selesai') continue;

                $total = (float) ($tarif[$doc->poli_id] ?? 100000) + mt_rand(0, 3) * 25000;
                $lunas = !($off === 0 && mt_rand(0, 2) === 0); // beberapa invoice hari ini belum dibayar
                $inv = Invoice::create([
                    'nomor' => 'INV-'.$day->format('Ymd').'-'.str_pad((string) $visit->id, 4, '0', STR_PAD_LEFT), 'visit_id' => $visit->id,
                    'patient_id' => $visit->patient_id, 'subtotal' => $total, 'diskon' => 0, 'total' => $total, 'status' => $lunas ? 'lunas' : 'belum_bayar',
                ]);
                if ($lunas) {
                    Payment::create(['invoice_id' => $inv->id, 'jumlah' => $total, 'metode' => ['tunai', 'transfer', 'qris'][mt_rand(0, 2)],
                        'status' => 'terverifikasi', 'created_at' => $day->copy()->setTime(mt_rand(8, 19), mt_rand(0, 59)), 'updated_at' => $day]);
                }
            }
        }

        for ($m = 3; $m >= 0; $m--) {
            $d = now()->startOfMonth()->subMonths($m)->addDays(2);
            if ($d->isFuture()) $d = now();
            foreach ([['Gaji pegawai', 15000000], ['Sewa gedung', 6000000], ['Listrik dan air', 1500000], ['Pembelian obat', 4000000], ['Alat habis pakai', 900000]] as [$kat, $jml]) {
                Expense::create(['tanggal' => $d->toDateString(), 'kategori' => $kat, 'keterangan' => 'Data contoh', 'jumlah' => $jml + mt_rand(0, 5) * 100000]);
            }
        }

        $kat = MedicineCategory::firstOrCreate(['nama' => 'Umum']);
        foreach ([['OB-001', 'Paracetamol 500 mg', 'tablet', 200, 90], ['OB-002', 'Amoxicillin 500 mg', 'kapsul', 5, 200], ['OB-003', 'Vitamin C 500 mg', 'tablet', 50, 20]] as [$kode, $nama, $sat, $stok, $hari]) {
            $med = Medicine::firstOrCreate(['kode' => $kode], ['nama' => $nama, 'category_id' => $kat->id, 'satuan' => $sat, 'harga_jual' => 2000, 'stok_minimum' => 20]);
            MedicineBatch::firstOrCreate(['medicine_id' => $med->id, 'no_batch' => 'B-'.$kode], ['tgl_kedaluwarsa' => now()->addDays($hari)->toDateString(), 'stok' => $stok, 'harga_beli' => 1000]);
        }
    }
}
