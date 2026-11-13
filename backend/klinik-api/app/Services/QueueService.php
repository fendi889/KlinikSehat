<?php

namespace App\Services;

use App\Models\Poli;
use App\Models\Queue;
use App\Models\Visit;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Schedule;
use App\Models\Setting;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class QueueService
{
    /** Buat kunjungan + nomor antrian otomatis per poli per tanggal tanpa nomor ganda. */
    public function register(array $data, ?int $createdBy, ?callable $guard = null): Queue
    {
        return DB::transaction(function () use ($data, $createdBy, $guard) {
            // Kunci baris poli agar dua pendaftaran bersamaan tidak mendapat nomor sama.
            $poli = Poli::whereKey($data['poli_id'])->lockForUpdate()->firstOrFail();

            if ($guard) $guard($poli); // pengecekan kuota/duplikat dilakukan setelah poli dikunci

            $visit = Visit::create([
                'patient_id' => $data['patient_id'], 'doctor_id' => $data['doctor_id'], 'poli_id' => $poli->id,
                'tanggal' => $data['tanggal'], 'keluhan' => $data['keluhan'] ?? null, 'schedule_id' => $data['schedule_id'] ?? null, 'created_by' => $createdBy,
            ]);

            $nomor = (int) Queue::where('poli_id', $poli->id)->where('tanggal', $data['tanggal'])->max('nomor') + 1;

            return Queue::create([
                'visit_id' => $visit->id, 'poli_id' => $poli->id, 'tanggal' => $data['tanggal'],
                'nomor' => $nomor, 'kode' => $poli->kode.'-'.str_pad((string) $nomor, 3, '0', STR_PAD_LEFT),
            ])->load('visit.patient', 'poli');
        });
    }

    /** Pendaftaran dengan semua pemeriksaan jadwal, kuota, dan duplikat. Mengembalikan [antrian, dokter, jadwal]. */
    public function book(Patient $patient, array $d, ?int $userId): array
    {
        $tgl = Carbon::parse($d['tanggal'])->startOfDay();
        abort_if($tgl->lt(today()) || $tgl->gt(today()->addDays(13)), 422, 'Tanggal harus dalam 14 hari ke depan.');
        $doctor = Doctor::with('user:id,name')->findOrFail($d['doctor_id']);
        $schedule = Schedule::where('doctor_id', $doctor->id)->where('aktif', true)->where('hari', $tgl->dayOfWeekIso)->first();
        abort_unless($schedule, 422, 'Dokter tidak praktik pada tanggal tersebut.');
        $max = (int) (Setting::where('key', 'maks_antrian_per_poli')->value('value') ?: 100);

        $queue = $this->register(
            ['patient_id' => $patient->id, 'poli_id' => $doctor->poli_id, 'doctor_id' => $doctor->id, 'tanggal' => $tgl->toDateString(),
             'keluhan' => $d['keluhan'] ?? null, 'schedule_id' => $schedule->id],
            $userId,
            function ($poli) use ($patient, $doctor, $tgl, $schedule, $max) {
                $aktif = Visit::where('doctor_id', $doctor->id)->where('tanggal', $tgl->toDateString())->where('status', '!=', 'batal');
                abort_if((clone $aktif)->where('patient_id', $patient->id)->exists(), 422, 'Pasien sudah terdaftar pada dokter dan tanggal ini.');
                abort_if($aktif->count() >= $schedule->kuota, 422, 'Kuota dokter pada tanggal ini sudah penuh.');
                abort_if(Queue::where('poli_id', $poli->id)->where('tanggal', $tgl->toDateString())->count() >= $max, 422, 'Antrian poli pada tanggal ini sudah penuh.');
            }
        );
        return [$queue, $doctor, $schedule];
    }
}
