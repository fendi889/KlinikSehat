<?php

namespace Database\Seeders;

use App\Models\AppNotification;
use App\Models\Diagnosis;
use App\Models\Doctor;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\MedicalRecord;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Procedure;
use App\Models\User;
use App\Models\Visit;
use App\Models\VitalSign;
use Illuminate\Database\Seeder;

/** Riwayat contoh untuk pasien@kliniksehat.test. Hanya untuk pengembangan. */
class DemoPasienSeeder extends Seeder
{
    public function run(): void
    {
        $p = Patient::where('user_id', User::where('email', 'pasien@kliniksehat.test')->value('id'))->first();
        $doctors = Doctor::all();
        if (!$p || $doctors->isEmpty() || MedicalRecord::where('patient_id', $p->id)->exists()) return;
        $med = Medicine::first();

        foreach ([20, 8] as $ago) {
            $doc = $doctors->random();
            $v = Visit::create(['patient_id' => $p->id, 'doctor_id' => $doc->id, 'poli_id' => $doc->poli_id, 'tanggal' => now()->subDays($ago)->toDateString(), 'keluhan' => 'Batuk dan demam ringan', 'status' => 'selesai']);
            VitalSign::create(['visit_id' => $v->id, 'td_sistol' => 120, 'td_diastol' => 80, 'nadi' => 78, 'suhu' => 37.4, 'napas' => 18, 'spo2' => 98, 'bb' => 60, 'tb' => 165]);
            $mr = MedicalRecord::create(['visit_id' => $v->id, 'patient_id' => $p->id, 'doctor_id' => $doc->id, 'keluhan_utama' => 'Batuk dan demam ringan 3 hari',
                'pemeriksaan_fisik' => 'Faring hiperemis, paru bersih.', 'catatan_dokter' => 'Banyak istirahat dan minum air putih. Kontrol bila demam lebih dari 3 hari.']);
            Diagnosis::create(['medical_record_id' => $mr->id, 'kode_icd' => 'J06.9', 'nama' => 'Infeksi saluran napas atas akut']);
            Procedure::create(['medical_record_id' => $mr->id, 'nama' => 'Pemeriksaan fisik', 'biaya' => 0]);
            if ($med) {
                $rx = Prescription::create(['medical_record_id' => $mr->id, 'status' => 'diserahkan']);
                PrescriptionItem::create(['prescription_id' => $rx->id, 'medicine_id' => $med->id, 'jumlah' => 10, 'aturan_pakai' => '3 x 1 tablet sesudah makan']);
            }
            $inv = Invoice::create(['nomor' => 'INV-'.now()->subDays($ago)->format('Ymd').'-P'.$v->id, 'visit_id' => $v->id, 'patient_id' => $p->id, 'subtotal' => 95000, 'total' => 95000, 'status' => 'lunas']);
            InvoiceItem::create(['invoice_id' => $inv->id, 'deskripsi' => 'Konsultasi dokter', 'qty' => 1, 'harga' => 75000]);
            InvoiceItem::create(['invoice_id' => $inv->id, 'deskripsi' => 'Obat', 'qty' => 1, 'harga' => 20000]);
            Payment::create(['invoice_id' => $inv->id, 'jumlah' => 95000, 'metode' => 'tunai', 'status' => 'terverifikasi', 'created_at' => now()->subDays($ago)]);
        }
        AppNotification::create(['user_id' => $p->user_id, 'tipe' => 'hasil', 'judul' => 'Hasil pemeriksaan tersedia', 'pesan' => 'Hasil pemeriksaan Anda sudah dapat dilihat di menu Riwayat.']);
    }
}
