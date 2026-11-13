<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Patient;
use App\Models\ProcedureSchedule;
use App\Models\Queue;
use App\Models\Room;
use App\Models\Visit;
use App\Models\VitalSign;
use App\Services\AuditService;
use App\Services\QueueService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PerawatController extends Controller
{
    private function active(Visit $v): Visit
    {
        abort_if(in_array($v->status, ['selesai', 'batal'], true), 422, 'Kunjungan ini sudah selesai atau dibatalkan.');
        return $v;
    }

    private function notify(Visit $v, string $judul, string $pesan): void
    {
        if ($uid = $v->patient?->user_id) AppNotification::create(['user_id' => $uid, 'tipe' => 'antrian', 'judul' => $judul, 'pesan' => $pesan]);
    }

    // ---------- Pendaftaran langsung ----------
    public function patients(Request $r)
    {
        $s = trim((string) $r->query('q'));
        if (mb_strlen($s) < 2) return [];
        return Patient::where(fn ($w) => $w->where('nama', 'ilike', "%$s%")->orWhere('no_rm', 'ilike', "%$s%")->orWhere('nik', 'like', "%$s%"))
            ->orderBy('nama')->take(10)->get(['id', 'nama', 'no_rm', 'nik', 'tgl_lahir', 'jenis_kelamin', 'alergi']);
    }

    public function storePatient(Request $r)
    {
        $d = $r->validate([
            'nama' => 'required|string|max:100', 'nik' => 'nullable|digits:16|unique:patients,nik', 'tgl_lahir' => 'nullable|date|before:today',
            'jenis_kelamin' => 'nullable|in:L,P', 'alamat' => 'nullable|string', 'alergi' => 'nullable|string', 'kontak_darurat' => 'nullable|string|max:100',
        ]);
        $p = Patient::create($d + ['no_rm' => Patient::nextRm()]);
        AuditService::log('pasien.buat', 'patient:'.$p->id, ['via' => 'perawat']);
        return response()->json($p->only(['id', 'nama', 'no_rm', 'nik', 'tgl_lahir', 'jenis_kelamin', 'alergi']), 201);
    }

    public function register(Request $r, QueueService $svc)
    {
        $d = $r->validate(['patient_id' => 'required|exists:patients,id', 'doctor_id' => 'required|exists:doctors,id', 'tanggal' => 'required|date', 'keluhan' => 'nullable|string|max:500']);
        $patient = Patient::findOrFail($d['patient_id']);
        [$queue, $doctor, $schedule] = $svc->book($patient, $d, $r->user()->id);
        $queue->load('poli:id,nama');
        if ($patient->user_id) AppNotification::create(['user_id' => $patient->user_id, 'tipe' => 'pendaftaran', 'judul' => 'Pendaftaran berhasil', 'pesan' => "Nomor antrian {$queue->kode} untuk {$queue->poli->nama}."]);
        return response()->json([
            'kode' => $queue->kode, 'pasien' => $patient->nama, 'no_rm' => $patient->no_rm, 'tanggal' => Carbon::parse($d['tanggal'])->toDateString(),
            'poli_nama' => $queue->poli->nama, 'doctor_nama' => $doctor->user->name, 'jam' => substr($schedule->jam_mulai, 0, 5).'–'.substr($schedule->jam_selesai, 0, 5),
        ], 201);
    }

    // ---------- Antrian & status pelayanan ----------
    public function queue(Request $r)
    {
        $tgl = $r->query('tanggal', today()->toDateString());
        $rows = Queue::where('tanggal', $tgl)->when($r->query('poli_id'), fn ($q, $id) => $q->where('poli_id', $id))
            ->with('poli:id,nama', 'visit.patient:id,nama,no_rm,nik,tgl_lahir,jenis_kelamin,alergi', 'visit.vitalSign:id,visit_id', 'visit.room:id,nama', 'visit.doctor.user:id,name')
            ->orderBy('poli_id')->orderBy('nomor')->get();
        return [
            'ringkasan' => $rows->groupBy('status')->map->count(),
            'antrian' => $rows->map(fn ($q) => [
                'id' => $q->id, 'kode' => $q->kode, 'status' => $q->status, 'poli_id' => $q->poli_id, 'poli_nama' => $q->poli->nama, 'visit_id' => $q->visit_id,
                'visit_status' => $q->visit->status, 'keluhan' => $q->visit->keluhan, 'dokter' => $q->visit->doctor?->user?->name, 'ruang' => $q->visit->room?->nama, 'room_id' => $q->visit->room_id,
                'ada_tanda_vital' => (bool) $q->visit->vitalSign, 'pasien' => $q->visit->patient->nama, 'no_rm' => $q->visit->patient->no_rm, 'nik' => $q->visit->patient->nik,
                'umur' => $q->visit->patient->tgl_lahir ? Carbon::parse($q->visit->patient->tgl_lahir)->age : null, 'jenis_kelamin' => $q->visit->patient->jenis_kelamin, 'alergi' => $q->visit->patient->alergi,
            ])->values(),
        ];
    }

    public function call(Queue $queue)
    {
        $v = $this->active($queue->visit);
        abort_if(in_array($queue->status, ['dilayani', 'selesai', 'batal'], true), 422, 'Antrian ini tidak dapat dipanggil.');
        $queue->update(['status' => 'dipanggil', 'called_at' => now()]);
        $this->notify($v, 'Nomor antrian dipanggil', "Nomor {$queue->kode} dipanggil. Silakan menuju meja perawat/ruang pemeriksaan.");
        return ['message' => "Nomor {$queue->kode} dipanggil."];
    }

    public function verify(Request $r, Visit $visit)
    {
        $this->active($visit);
        abort_unless($visit->status === 'terdaftar', 422, 'Kunjungan ini sudah diverifikasi.');
        $visit->update(['status' => 'diverifikasi']);
        AuditService::log('kunjungan.verifikasi', 'visit:'.$visit->id);
        return ['message' => 'Pasien terverifikasi.'];
    }

    // ---------- Tanda vital ----------
    public function showVitals(Visit $visit)
    {
        $visit->load('patient:id,nama,no_rm,tgl_lahir,alergi', 'vitalSign', 'queue:id,visit_id,kode');
        return ['kode' => $visit->queue?->kode, 'status' => $visit->status, 'pasien' => $visit->patient->only(['nama', 'no_rm', 'alergi']), 'tanda_vital' => $visit->vitalSign];
    }

    public function saveVitals(Request $r, Visit $visit)
    {
        $this->active($visit);
        $d = $r->validate([
            'td_sistol' => 'nullable|integer|between:40,300', 'td_diastol' => 'nullable|integer|between:20,200', 'nadi' => 'nullable|integer|between:20,250',
            'suhu' => 'nullable|numeric|between:30,45', 'napas' => 'nullable|integer|between:5,80', 'spo2' => 'nullable|integer|between:50,100',
            'bb' => 'nullable|numeric|between:1,400', 'tb' => 'nullable|numeric|between:30,250',
        ]);
        $tv = array_filter($d, fn ($x) => $x !== null && $x !== '');
        abort_if(!$tv, 422, 'Isi minimal satu nilai tanda vital.');
        $vs = VitalSign::updateOrCreate(['visit_id' => $visit->id], $tv + ['nurse_id' => $r->user()->id]);
        if (in_array($visit->status, ['terdaftar', 'diverifikasi'], true)) $visit->update(['status' => 'menunggu_dokter']);
        return ['message' => 'Tanda vital disimpan. Pasien siap diperiksa dokter.', 'tanda_vital' => $vs];
    }

    // ---------- Ruang pemeriksaan ----------
    public function rooms()
    {
        $pakai = Visit::whereNotNull('room_id')->where('tanggal', today()->toDateString())->whereNotIn('status', ['selesai', 'batal'])
            ->with('patient:id,nama', 'queue:id,visit_id,kode')->get()->keyBy('room_id');
        return Room::where('aktif', true)->orderBy('id')->get()->map(fn ($rm) => [
            'id' => $rm->id, 'nama' => $rm->nama,
            'terpakai' => $pakai->has($rm->id) ? ['visit_id' => $pakai[$rm->id]->id, 'pasien' => $pakai[$rm->id]->patient->nama, 'kode' => $pakai[$rm->id]->queue?->kode] : null,
        ]);
    }

    public function assignRoom(Request $r, Visit $visit)
    {
        $this->active($visit);
        $d = $r->validate(['room_id' => 'nullable|exists:rooms,id']);
        if (!empty($d['room_id'])) {
            abort_unless(Room::whereKey($d['room_id'])->where('aktif', true)->exists(), 422, 'Ruang tidak aktif.');
            abort_if(Visit::where('room_id', $d['room_id'])->where('id', '!=', $visit->id)->where('tanggal', today()->toDateString())->whereNotIn('status', ['selesai', 'batal'])->exists(), 422, 'Ruang sedang dipakai pasien lain.');
        }
        $visit->update(['room_id' => $d['room_id'] ?? null]);
        return ['message' => $visit->room_id ? 'Pasien ditempatkan di ruang.' : 'Ruang dikosongkan.'];
    }

    // ---------- Jadwal tindakan ----------
    public function tasks(Request $r)
    {
        return ProcedureSchedule::with('patient:id,nama,no_rm')->where('status', $r->query('status', 'terjadwal'))->orderBy('jadwal_at')->take(100)->get();
    }

    public function storeTask(Request $r)
    {
        $d = $r->validate(['patient_id' => 'required|exists:patients,id', 'nama' => 'required|string|max:150', 'jadwal_at' => 'required|date|after_or_equal:today', 'catatan' => 'nullable|string|max:300']);
        $t = ProcedureSchedule::create($d + ['nurse_id' => $r->user()->id]);
        return response()->json($t->load('patient:id,nama,no_rm'), 201);
    }

    public function taskStatus(Request $r, ProcedureSchedule $task)
    {
        $d = $r->validate(['status' => 'required|in:selesai,batal']);
        abort_unless($task->status === 'terjadwal', 422, 'Tindakan ini sudah selesai atau dibatalkan.');
        $task->update($d);
        return $task;
    }

    public function skip(Queue $queue)
    {
        $v = $this->active($queue->visit);
        abort_unless(in_array($queue->status, ['menunggu', 'dipanggil'], true), 422, 'Hanya antrian menunggu atau dipanggil yang dapat dilewati.');
        $queue->update(['status' => 'terlewat']);
        $this->notify($v, 'Nomor antrian terlewat', "Nomor {$queue->kode} terlewat karena Anda belum hadir. Segera lapor ke perawat agar dimasukkan kembali.");
        return ['message' => "Nomor {$queue->kode} ditandai terlewat."];
    }

    public function requeue(Queue $queue)
    {
        $this->active($queue->visit);
        abort_unless($queue->status === 'terlewat', 422, 'Hanya antrian terlewat yang dapat dimasukkan kembali.');
        $queue->update(['status' => 'menunggu', 'called_at' => null]);
        return ['message' => "Nomor {$queue->kode} kembali ke antrian."];
    }

    public function cancelQueue(Queue $queue)
    {
        $v = $this->active($queue->visit);
        abort_if(in_array($queue->status, ['dilayani', 'selesai'], true) || $v->status === 'diperiksa', 422, 'Pasien sedang atau sudah diperiksa, antrian tidak dapat dibatalkan.');
        \Illuminate\Support\Facades\DB::transaction(function () use ($queue, $v) { $queue->update(['status' => 'batal']); $v->update(['status' => 'batal']); });
        AuditService::log('antrian.batal', 'queue:'.$queue->id);
        $this->notify($v, 'Antrian dibatalkan', "Nomor antrian {$queue->kode} dibatalkan oleh petugas.");
        return ['message' => "Nomor {$queue->kode} dibatalkan."];
    }
}
