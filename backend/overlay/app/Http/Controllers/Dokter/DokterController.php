<?php

namespace App\Http\Controllers\Dokter;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Doctor;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\MedicalDocument;
use App\Models\MedicalRecord;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Queue;
use App\Models\RecordRevision;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\Visit;
use App\Models\VitalSign;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class DokterController extends Controller
{
    private const HARI = [1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu', 7 => 'Minggu'];
    private const MR_FIELDS = ['keluhan_utama', 'riwayat_penyakit', 'pemeriksaan_fisik', 'catatan_dokter'];

    private function doctor(Request $r): Doctor
    {
        $d = Doctor::where('user_id', $r->user()->id)->first();
        abort_unless($d, 403, 'Akun ini belum terdaftar sebagai dokter. Hubungi admin klinik.');
        return $d;
    }

    private function mine(Request $r, Visit $visit): Visit
    {
        abort_unless($visit->doctor_id === $this->doctor($r)->id, 404, 'Data tidak ditemukan.');
        return $visit;
    }

    private function notify(Visit $v, string $tipe, string $judul, string $pesan): void
    {
        if ($uid = $v->patient?->user_id) AppNotification::create(['user_id' => $uid, 'tipe' => $tipe, 'judul' => $judul, 'pesan' => $pesan]);
    }

    private function umur(?string $tgl): ?int { return $tgl ? Carbon::parse($tgl)->age : null; }

    private function payload(Visit $v): array
    {
        $v->load('patient', 'poli:id,nama', 'vitalSign', 'medicalRecord.diagnoses', 'medicalRecord.procedures',
            'medicalRecord.prescriptions.items.medicine:id,nama,satuan', 'medicalRecord.documents');
        $p = $v->patient;
        $prev = Visit::where('patient_id', $p->id)->where('id', '!=', $v->id)->where('status', 'selesai')->orderByDesc('tanggal')->take(3)
            ->with('medicalRecord.diagnoses', 'doctor.user:id,name')->get()->map(fn ($x) => [
                'id' => $x->id, 'tanggal' => $x->tanggal->toDateString(), 'dokter' => $x->doctor?->user?->name,
                'diagnosa' => $x->medicalRecord?->diagnoses->pluck('nama')->all() ?? [],
            ]);
        return [
            'visit' => ['id' => $v->id, 'tanggal' => $v->tanggal->toDateString(), 'status' => $v->status, 'keluhan' => $v->keluhan, 'poli_nama' => $v->poli?->nama],
            'pasien' => ['id' => $p->id, 'nama' => $p->nama, 'no_rm' => $p->no_rm, 'umur' => $this->umur($p->tgl_lahir), 'jenis_kelamin' => $p->jenis_kelamin,
                'golongan_darah' => $p->golongan_darah, 'alergi' => $p->alergi],
            'tanda_vital' => $v->vitalSign, 'rekam_medis' => $v->medicalRecord, 'riwayat_sebelumnya' => $prev,
        ];
    }

    public function schedule(Request $r)
    {
        return Schedule::where('doctor_id', $this->doctor($r)->id)->orderBy('hari')->orderBy('jam_mulai')->get()->map(fn ($s) => [
            'id' => $s->id, 'hari' => $s->hari, 'hari_nama' => self::HARI[$s->hari], 'jam_mulai' => substr($s->jam_mulai, 0, 5),
            'jam_selesai' => substr($s->jam_selesai, 0, 5), 'kuota' => $s->kuota, 'aktif' => $s->aktif,
        ]);
    }

    // ---------- Antrian ----------
    public function queue(Request $r)
    {
        $id = $this->doctor($r)->id;
        $tgl = $r->query('tanggal', today()->toDateString());
        return Queue::where('tanggal', $tgl)->whereHas('visit', fn ($q) => $q->where('doctor_id', $id))
            ->with('visit.patient:id,nama,no_rm,tgl_lahir,jenis_kelamin,alergi', 'visit.vitalSign:id,visit_id')->orderBy('nomor')->get()
            ->map(fn ($q) => [
                'id' => $q->id, 'kode' => $q->kode, 'status' => $q->status, 'visit_id' => $q->visit_id, 'visit_status' => $q->visit->status,
                'keluhan' => $q->visit->keluhan, 'ada_tanda_vital' => (bool) $q->visit->vitalSign,
                'pasien' => $q->visit->patient->nama, 'no_rm' => $q->visit->patient->no_rm, 'umur' => $this->umur($q->visit->patient->tgl_lahir),
                'jenis_kelamin' => $q->visit->patient->jenis_kelamin, 'alergi' => $q->visit->patient->alergi,
            ]);
    }

    public function call(Request $r, Queue $queue)
    {
        $v = $this->mine($r, $queue->visit);
        abort_if(in_array($v->status, ['selesai', 'batal'], true), 422, 'Kunjungan ini sudah selesai atau dibatalkan.');
        $queue->update(['status' => 'dipanggil', 'called_at' => now()]);
        if ($v->status === 'terdaftar') $v->update(['status' => 'menunggu_dokter']);
        $this->notify($v, 'antrian', 'Nomor antrian dipanggil', "Nomor {$queue->kode} dipanggil. Silakan menuju ruang pemeriksaan.");
        return ['message' => "Nomor {$queue->kode} dipanggil."];
    }

    // ---------- Pemeriksaan ----------
    public function start(Request $r, Visit $visit)
    {
        $v = $this->mine($r, $visit);
        abort_if(in_array($v->status, ['selesai', 'batal'], true), 422, 'Kunjungan ini sudah selesai atau dibatalkan.');
        DB::transaction(function () use ($v) {
            $v->update(['status' => 'diperiksa']);
            $v->queue?->update(['status' => 'dilayani']);
            MedicalRecord::firstOrCreate(['visit_id' => $v->id], ['patient_id' => $v->patient_id, 'doctor_id' => $v->doctor_id, 'keluhan_utama' => $v->keluhan]);
        });
        return $this->payload($v);
    }

    public function show(Request $r, Visit $visit) { return $this->payload($this->mine($r, $visit)); }

    public function saveExam(Request $r, Visit $visit)
    {
        $v = $this->mine($r, $visit);
        abort_unless($v->status === 'diperiksa', 422, 'Mulai pemeriksaan terlebih dahulu, atau pemeriksaan sudah selesai dan tidak dapat diubah.');
        $d = $r->validate([
            'keluhan_utama' => 'nullable|string|max:5000', 'riwayat_penyakit' => 'nullable|string|max:5000',
            'pemeriksaan_fisik' => 'nullable|string|max:5000', 'catatan_dokter' => 'nullable|string|max:5000',
            'diagnoses' => 'array|max:20', 'diagnoses.*.nama' => 'required|string|max:200', 'diagnoses.*.kode_icd' => 'nullable|string|max:10',
            'procedures' => 'array|max:20', 'procedures.*.nama' => 'required|string|max:200', 'procedures.*.biaya' => 'nullable|numeric|min:0|max:100000000',
            'tanda_vital' => 'nullable|array', 'tanda_vital.td_sistol' => 'nullable|integer|between:40,300', 'tanda_vital.td_diastol' => 'nullable|integer|between:20,200',
            'tanda_vital.nadi' => 'nullable|integer|between:20,250', 'tanda_vital.suhu' => 'nullable|numeric|between:30,45', 'tanda_vital.napas' => 'nullable|integer|between:5,80',
            'tanda_vital.spo2' => 'nullable|integer|between:50,100', 'tanda_vital.bb' => 'nullable|numeric|between:1,400', 'tanda_vital.tb' => 'nullable|numeric|between:30,250',
        ]);

        DB::transaction(function () use ($d, $v, $r) {
            $mr = MedicalRecord::firstOrCreate(['visit_id' => $v->id], ['patient_id' => $v->patient_id, 'doctor_id' => $v->doctor_id]);
            $before = $mr->only(self::MR_FIELDS) + ['diagnosa' => $mr->diagnoses->pluck('nama')->all(), 'tindakan' => $mr->procedures->pluck('nama')->all()];
            $mr->update(Arr::only($d, self::MR_FIELDS));
            if (array_key_exists('diagnoses', $d)) { $mr->diagnoses()->delete(); foreach ($d['diagnoses'] as $x) $mr->diagnoses()->create(['nama' => $x['nama'], 'kode_icd' => $x['kode_icd'] ?? null]); }
            if (array_key_exists('procedures', $d)) { $mr->procedures()->delete(); foreach ($d['procedures'] as $x) $mr->procedures()->create(['nama' => $x['nama'], 'biaya' => $x['biaya'] ?? 0]); }
            $tv = array_filter($d['tanda_vital'] ?? [], fn ($x) => $x !== null && $x !== '');
            if ($tv) VitalSign::updateOrCreate(['visit_id' => $v->id], $tv);
            $mr->load('diagnoses', 'procedures');
            $after = $mr->only(self::MR_FIELDS) + ['diagnosa' => $mr->diagnoses->pluck('nama')->all(), 'tindakan' => $mr->procedures->pluck('nama')->all()];
            if ($before != $after) RecordRevision::create(['medical_record_id' => $mr->id, 'user_id' => $r->user()->id, 'perubahan' => ['sebelum' => $before, 'sesudah' => $after]]);
        });
        return $this->payload($v->fresh());
    }

    public function prescribe(Request $r, Visit $visit)
    {
        $v = $this->mine($r, $visit);
        abort_unless($v->status === 'diperiksa', 422, 'Resep hanya dapat dibuat saat pemeriksaan berlangsung.');
        $d = $r->validate([
            'items' => 'required|array|min:1|max:20', 'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.jumlah' => 'required|integer|between:1,1000', 'items.*.aturan_pakai' => 'required|string|max:150',
        ]);
        $mr = MedicalRecord::where('visit_id', $v->id)->firstOrFail();
        $rx = $mr->prescriptions()->first();
        abort_if($rx && $rx->status !== 'baru', 422, 'Resep sudah diproses apoteker dan tidak dapat diubah.');

        $baru = !$rx;
        DB::transaction(function () use ($mr, &$rx, $d) {
            $rx ??= Prescription::create(['medical_record_id' => $mr->id, 'status' => 'baru']);
            $rx->items()->delete();
            foreach ($d['items'] as $i) $rx->items()->create(Arr::only($i, ['medicine_id', 'jumlah', 'aturan_pakai']));
        });

        $alergi = mb_strtolower((string) $v->patient->alergi);
        $peringatan = [];
        foreach ($d['items'] as $i) {
            $m = Medicine::withSum('batches as stok', 'stok')->find($i['medicine_id']);
            $kata = mb_strtolower(strtok($m->nama, ' '));
            if ($alergi !== '' && $kata !== '' && str_contains($alergi, $kata)) $peringatan[] = "Pasien memiliki catatan alergi yang menyebut {$m->nama}.";
            if ((int) $m->stok < $i['jumlah']) $peringatan[] = "Stok {$m->nama} ({$m->stok}) kurang dari jumlah resep ({$i['jumlah']}).";
        }
        if ($baru) $this->notify($v, 'resep', 'Resep obat dibuat', 'Dokter telah membuat resep. Apoteker akan menyiapkan obat Anda.');
        return ['resep' => $rx->load('items.medicine:id,nama,satuan'), 'peringatan' => $peringatan];
    }

    public function finish(Request $r, Visit $visit)
    {
        $v = $this->mine($r, $visit)->load('queue');
        abort_unless($v->status === 'diperiksa', 422, 'Pemeriksaan belum dimulai atau sudah selesai.');
        $mr = MedicalRecord::with('diagnoses', 'procedures')->where('visit_id', $v->id)->firstOrFail();
        abort_if($mr->diagnoses->isEmpty(), 422, 'Isi minimal satu diagnosa sebelum menyelesaikan pemeriksaan.');

        DB::transaction(function () use ($v, $mr) {
            $v->update(['status' => 'selesai']);
            $v->queue?->update(['status' => 'selesai']);
            if (!Invoice::where('visit_id', $v->id)->exists()) {
                $tarif = (float) (Service::where('poli_id', $v->poli_id)->where('aktif', true)->value('tarif') ?? 0);
                $inv = Invoice::create(['nomor' => 'INV-'.now()->format('Ymd').'-'.str_pad((string) $v->id, 4, '0', STR_PAD_LEFT), 'visit_id' => $v->id, 'patient_id' => $v->patient_id, 'status' => 'belum_bayar']);
                InvoiceItem::create(['invoice_id' => $inv->id, 'deskripsi' => 'Konsultasi dokter', 'qty' => 1, 'harga' => $tarif]);
                foreach ($mr->procedures as $p) if ($p->biaya > 0) InvoiceItem::create(['invoice_id' => $inv->id, 'deskripsi' => $p->nama, 'qty' => 1, 'harga' => $p->biaya]);
                $sub = (float) $inv->items()->sum(DB::raw('qty * harga'));
                $inv->update(['subtotal' => $sub, 'total' => $sub]);
            }
        });
        $this->notify($v, 'hasil', 'Hasil pemeriksaan tersedia', 'Hasil pemeriksaan Anda dapat dilihat di menu Riwayat.');
        return ['message' => 'Pemeriksaan selesai. Tagihan dibuat otomatis.'];
    }

    // ---------- Surat sakit & jadwal kontrol ----------
    public function storeDocument(Request $r, Visit $visit)
    {
        $v = $this->mine($r, $visit);
        $mr = MedicalRecord::where('visit_id', $v->id)->first();
        abort_unless($mr, 422, 'Rekam medis kunjungan ini belum dibuat. Mulai pemeriksaan terlebih dahulu.');
        $jenis = $r->validate(['jenis' => 'required|in:surat_sakit,jadwal_kontrol'])['jenis'];

        if ($jenis === 'surat_sakit') {
            $d = $r->validate(['mulai' => 'required|date', 'lama_hari' => 'required|integer|between:1,30', 'keterangan' => 'nullable|string|max:300']);
            $doc = $mr->documents()->create(['jenis' => $jenis, 'judul' => "Surat sakit {$d['lama_hari']} hari", 'isi' => $d]);
            $this->notify($v, 'hasil', 'Surat sakit diterbitkan', "Surat sakit {$d['lama_hari']} hari telah diterbitkan.");
        } else {
            $d = $r->validate(['tanggal' => 'required|date|after:today', 'catatan' => 'nullable|string|max:300']);
            $doc = $mr->documents()->create(['jenis' => $jenis, 'judul' => 'Kontrol '.Carbon::parse($d['tanggal'])->format('d/m/Y'), 'isi' => $d]);
            $this->notify($v, 'jadwal', 'Jadwal kontrol', 'Anda dijadwalkan kontrol pada '.Carbon::parse($d['tanggal'])->format('d/m/Y').'.');
        }
        return response()->json($doc, 201);
    }

    public function documents(Request $r)
    {
        $id = $this->doctor($r)->id;
        return MedicalDocument::whereHas('medicalRecord', fn ($q) => $q->where('doctor_id', $id))
            ->with('medicalRecord.patient:id,nama,no_rm,tgl_lahir', 'medicalRecord.visit:id,tanggal')->latest()->paginate(15);
    }

    public function destroyDocument(Request $r, MedicalDocument $document)
    {
        abort_unless($document->medicalRecord->doctor_id === $this->doctor($r)->id, 404, 'Data tidak ditemukan.');
        $document->delete();
        return ['message' => 'Dokumen dihapus.'];
    }

    // ---------- Riwayat, pasien, resep, obat ----------
    public function history(Request $r)
    {
        return Visit::where('doctor_id', $this->doctor($r)->id)->where('status', 'selesai')->with('patient:id,nama,no_rm', 'medicalRecord.diagnoses')
            ->orderByDesc('tanggal')->orderByDesc('id')->paginate(10)->through(fn ($v) => [
                'id' => $v->id, 'tanggal' => $v->tanggal->toDateString(), 'pasien' => $v->patient->nama, 'no_rm' => $v->patient->no_rm,
                'diagnosa' => $v->medicalRecord?->diagnoses->pluck('nama')->all() ?? [],
            ]);
    }

    public function patients(Request $r)
    {
        $id = $this->doctor($r)->id;
        $q = Patient::whereHas('visits', fn ($w) => $w->where('doctor_id', $id))
            ->withMax(['visits as terakhir' => fn ($w) => $w->where('doctor_id', $id)], 'tanggal')->orderByDesc('terakhir');
        if ($s = $r->query('q')) $q->where(fn ($w) => $w->where('nama', 'ilike', "%$s%")->orWhere('no_rm', 'ilike', "%$s%"));
        return $q->paginate(15)->through(fn ($p) => [
            'id' => $p->id, 'nama' => $p->nama, 'no_rm' => $p->no_rm, 'umur' => $this->umur($p->tgl_lahir), 'jenis_kelamin' => $p->jenis_kelamin,
            'alergi' => $p->alergi, 'terakhir' => $p->terakhir,
        ]);
    }

    public function patientHistory(Request $r, Patient $patient)
    {
        abort_unless(Visit::where('doctor_id', $this->doctor($r)->id)->where('patient_id', $patient->id)->exists(), 404, 'Data tidak ditemukan.');
        return [
            'pasien' => ['id' => $patient->id, 'nama' => $patient->nama, 'no_rm' => $patient->no_rm, 'umur' => $this->umur($patient->tgl_lahir),
                'golongan_darah' => $patient->golongan_darah, 'alergi' => $patient->alergi],
            'kunjungan' => Visit::where('patient_id', $patient->id)->where('status', 'selesai')
                ->with('doctor.user:id,name', 'vitalSign', 'medicalRecord.diagnoses', 'medicalRecord.procedures', 'medicalRecord.prescriptions.items.medicine:id,nama,satuan')
                ->orderByDesc('tanggal')->take(30)->get()->map(fn ($v) => [
                    'id' => $v->id, 'tanggal' => $v->tanggal->toDateString(), 'dokter' => $v->doctor?->user?->name, 'keluhan' => $v->keluhan,
                    'tanda_vital' => $v->vitalSign, 'rekam_medis' => $v->medicalRecord,
                ]),
        ];
    }

    public function prescriptions(Request $r)
    {
        $id = $this->doctor($r)->id;
        return Prescription::whereHas('medicalRecord', fn ($q) => $q->where('doctor_id', $id))
            ->with('items.medicine:id,nama,satuan', 'medicalRecord.patient:id,nama,no_rm', 'medicalRecord.visit:id,tanggal')->latest()->paginate(15);
    }

    public function medicines(Request $r)
    {
        $q = Medicine::withSum('batches as stok', 'stok')->orderBy('nama')->take(20);
        if ($s = $r->query('q')) $q->where(fn ($w) => $w->where('nama', 'ilike', "%$s%")->orWhere('kode', 'ilike', "%$s%"));
        return $q->get(['id', 'kode', 'nama', 'satuan'])->map(fn ($m) => array_merge($m->toArray(), ['stok' => (int) $m->stok]));
    }

    /** Riwayat perubahan rekam medis (BAB 13). */
    public function revisions(Request $r, Visit $visit)
    {
        $mr = MedicalRecord::where('visit_id', $this->mine($r, $visit)->id)->first();
        if (!$mr) return [];
        return RecordRevision::where('medical_record_id', $mr->id)->with('user:id,name')->latest('id')->get()
            ->map(fn ($x) => ['waktu' => $x->created_at->toIso8601String(), 'oleh' => $x->user?->name, 'perubahan' => $x->perubahan]);
    }
}
