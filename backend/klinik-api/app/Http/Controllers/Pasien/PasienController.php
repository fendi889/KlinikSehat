<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Poli;
use App\Models\Prescription;
use App\Models\Queue;
use App\Models\Review;
use App\Models\Invoice;
use App\Models\Schedule;
use App\Models\Setting;
use App\Models\Visit;
use App\Services\QueueService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class PasienController extends Controller
{
    private const HARI = [1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu', 7 => 'Minggu'];
    private const AKTIF = ['menunggu', 'dipanggil', 'dilayani'];

    private function patient(Request $r): Patient { return Patient::where('user_id', $r->user()->id)->firstOrFail(); }

    private function mine(Request $r, Visit $visit): Visit
    {
        abort_unless($visit->patient_id === $this->patient($r)->id, 404, 'Data tidak ditemukan.');
        return $visit;
    }

    private function summary(Visit $v): array
    {
        return [
            'id' => $v->id, 'tanggal' => $v->tanggal->toDateString(), 'status' => $v->status, 'keluhan' => $v->keluhan,
            'poli_nama' => $v->poli?->nama, 'doctor_nama' => $v->doctor?->user?->name,
            'antrian_kode' => $v->queue?->kode, 'antrian_status' => $v->queue?->status, 'invoice_status' => $v->invoice?->status,
        ];
    }

    private function withRel(): array { return ['poli:id,nama', 'doctor.user:id,name', 'queue', 'invoice:id,visit_id,status']; }

    // ---------- Data diri ----------
    public function profile(Request $r)
    {
        return $this->patient($r)->only(['nama', 'nik', 'tgl_lahir', 'jenis_kelamin', 'golongan_darah', 'alamat', 'alergi', 'kontak_darurat', 'no_rm'])
            + ['email' => $r->user()->email, 'phone' => $r->user()->phone];
    }

    public function updateProfile(Request $r)
    {
        $p = $this->patient($r);
        $d = $r->validate([
            'nama' => 'required|string|max:100', 'nik' => ['nullable', 'digits:16', Rule::unique('patients', 'nik')->ignore($p->id)],
            'tgl_lahir' => 'nullable|date|before:today', 'jenis_kelamin' => 'nullable|in:L,P', 'golongan_darah' => 'nullable|in:A,B,AB,O',
            'alamat' => 'nullable|string', 'alergi' => 'nullable|string', 'kontak_darurat' => 'nullable|string|max:100', 'phone' => 'nullable|string|max:20',
        ]);
        $p->update(Arr::except($d, ['phone']));
        $r->user()->update(['name' => $d['nama'], 'phone' => $d['phone'] ?? null]);
        return $this->profile($r);
    }

    // ---------- Pendaftaran online ----------
    public function options()
    {
        return Poli::where('aktif', true)->with(['doctors.user:id,name', 'doctors.schedules' => fn ($q) => $q->where('aktif', true)->orderBy('hari')])->orderBy('id')->get()
            ->map(fn ($p) => [
                'id' => $p->id, 'nama' => $p->nama,
                'dokter' => $p->doctors->map(fn ($d) => [
                    'id' => $d->id, 'nama' => $d->user->name, 'spesialis' => $d->spesialis, 'pengalaman_tahun' => $d->pengalaman_tahun,
                    'jadwal' => $d->schedules->map(fn ($s) => self::HARI[$s->hari].' '.substr($s->jam_mulai, 0, 5).'–'.substr($s->jam_selesai, 0, 5))->all(),
                ])->all(),
            ]);
    }

    /** Tanggal praktik tersedia 14 hari ke depan beserta sisa kuota. */
    public function slots(Request $r)
    {
        $d = $r->validate(['doctor_id' => 'required|exists:doctors,id']);
        $schedules = Schedule::where('doctor_id', $d['doctor_id'])->where('aktif', true)->get();
        $used = Visit::where('doctor_id', $d['doctor_id'])->where('status', '!=', 'batal')
            ->whereBetween('tanggal', [today()->toDateString(), today()->addDays(13)->toDateString()])
            ->selectRaw('tanggal, count(*) as c')->groupBy('tanggal')->pluck('c', 'tanggal');
        $out = [];
        for ($i = 0; $i < 14; $i++) {
            $day = today()->addDays($i);
            foreach ($schedules->where('hari', $day->dayOfWeekIso) as $s) {
                if ($i === 0 && now()->format('H:i:s') > $s->jam_selesai) continue;
                $out[] = [
                    'tanggal' => $day->toDateString(), 'hari' => self::HARI[$day->dayOfWeekIso], 'jam' => substr($s->jam_mulai, 0, 5).'–'.substr($s->jam_selesai, 0, 5),
                    'sisa' => max(0, $s->kuota - (int) ($used[$day->toDateString()] ?? 0)),
                ];
            }
        }
        return $out;
    }

    public function register(Request $r, QueueService $svc)
    {
        $d = $r->validate(['doctor_id' => 'required|exists:doctors,id', 'tanggal' => 'required|date', 'keluhan' => 'nullable|string|max:500']);
        abort_if(Setting::where('key', 'pendaftaran_online_aktif')->value('value') === '0', 422, 'Pendaftaran online sedang ditutup.');

        $tgl = Carbon::parse($d['tanggal'])->startOfDay();
        abort_if($tgl->lt(today()) || $tgl->gt(today()->addDays(13)), 422, 'Tanggal harus dalam 14 hari ke depan.');
        $doctor = Doctor::findOrFail($d['doctor_id']);
        $schedule = Schedule::where('doctor_id', $doctor->id)->where('aktif', true)->where('hari', $tgl->dayOfWeekIso)->first();
        abort_unless($schedule, 422, 'Dokter tidak praktik pada tanggal tersebut.');
        abort_if($tgl->isToday() && now()->format('H:i:s') > $schedule->jam_selesai, 422, 'Jam praktik dokter hari ini sudah selesai.');

        $patient = $this->patient($r);
        $max = (int) (Setting::where('key', 'maks_antrian_per_poli')->value('value') ?: 100);
        $queue = $svc->register(
            ['patient_id' => $patient->id, 'poli_id' => $doctor->poli_id, 'doctor_id' => $doctor->id, 'tanggal' => $tgl->toDateString(),
             'keluhan' => $d['keluhan'] ?? null, 'schedule_id' => $schedule->id],
            $r->user()->id,
            function ($poli) use ($patient, $doctor, $tgl, $schedule, $max) {
                $aktif = Visit::where('doctor_id', $doctor->id)->where('tanggal', $tgl->toDateString())->where('status', '!=', 'batal');
                abort_if((clone $aktif)->where('patient_id', $patient->id)->exists(), 422, 'Anda sudah terdaftar pada dokter dan tanggal ini.');
                abort_if($aktif->count() >= $schedule->kuota, 422, 'Kuota dokter pada tanggal ini sudah penuh.');
                abort_if(Queue::where('poli_id', $poli->id)->where('tanggal', $tgl->toDateString())->count() >= $max, 422, 'Antrian poli pada tanggal ini sudah penuh.');
            }
        );
        $queue->load('poli:id,nama');
        AppNotification::create(['user_id' => $r->user()->id, 'tipe' => 'pendaftaran', 'judul' => 'Pendaftaran berhasil',
            'pesan' => "Nomor antrian {$queue->kode} untuk {$queue->poli->nama} pada ".$tgl->format('d/m/Y').'.']);

        return response()->json([
            'kode' => $queue->kode, 'nomor' => $queue->nomor, 'tanggal' => $tgl->toDateString(), 'poli_nama' => $queue->poli->nama,
            'doctor_nama' => $doctor->user->name, 'jam' => substr($schedule->jam_mulai, 0, 5).'–'.substr($schedule->jam_selesai, 0, 5),
        ], 201);
    }

    // ---------- Antrian & status kunjungan ----------
    public function active(Request $r)
    {
        return Visit::where('patient_id', $this->patient($r)->id)->where('tanggal', '>=', today()->toDateString())
            ->whereNotIn('status', ['batal', 'selesai'])->with($this->withRel())->orderBy('tanggal')->get()
            ->map(function ($v) {
                $q = $v->queue;
                $di_depan = $q && $q->status === 'menunggu'
                    ? Queue::where('poli_id', $q->poli_id)->where('tanggal', $q->tanggal)->where('nomor', '<', $q->nomor)->whereIn('status', self::AKTIF)->count() : null;
                $sekarang = $q ? Queue::where('poli_id', $q->poli_id)->where('tanggal', $q->tanggal)->whereIn('status', ['dipanggil', 'dilayani'])->orderByDesc('called_at')->value('kode') : null;
                return $this->summary($v) + ['di_depan' => $di_depan, 'sedang_dipanggil' => $sekarang];
            });
    }

    public function cancel(Request $r, Visit $visit)
    {
        $visit = $this->mine($r, $visit)->load('queue');
        abort_unless($visit->status === 'terdaftar' && $visit->queue?->status === 'menunggu', 422, 'Kunjungan ini tidak dapat dibatalkan.');
        $jam = Schedule::whereKey($visit->schedule_id)->value('jam_mulai') ?? '00:00:00';
        $mulai = Carbon::parse($visit->tanggal->toDateString().' '.$jam);
        $batas = (int) (Setting::where('key', 'batas_batal_jam')->value('value') ?? 1);
        abort_if(now()->gt($mulai->copy()->subHours($batas)), 422, "Pembatalan paling lambat {$batas} jam sebelum jadwal praktik dimulai.");
        $visit->update(['status' => 'batal']);
        $visit->queue->update(['status' => 'batal']);
        AppNotification::create(['user_id' => $r->user()->id, 'tipe' => 'pendaftaran', 'judul' => 'Antrian dibatalkan', 'pesan' => "Nomor antrian {$visit->queue->kode} dibatalkan."]);
        return ['message' => 'Antrian dibatalkan.'];
    }

    // ---------- Riwayat, rekam medis, hasil ----------
    public function visits(Request $r)
    {
        return Visit::where('patient_id', $this->patient($r)->id)->with($this->withRel())->orderByDesc('tanggal')->orderByDesc('id')
            ->paginate(10)->through(fn ($v) => $this->summary($v));
    }

    public function visitDetail(Request $r, Visit $visit)
    {
        $v = $this->mine($r, $visit)->load($this->withRel());
        $v->load('vitalSign', 'medicalRecord.diagnoses', 'medicalRecord.procedures', 'medicalRecord.prescriptions.items.medicine:id,nama,satuan', 'invoice.items', 'invoice.payments');
        return $this->summary($v) + ['tanda_vital' => $v->vitalSign, 'rekam_medis' => $v->medicalRecord, 'invoice' => $v->invoice];
    }

    public function prescriptions(Request $r)
    {
        $id = $this->patient($r)->id;
        return Prescription::whereHas('medicalRecord', fn ($q) => $q->where('patient_id', $id))
            ->with('items.medicine:id,nama,satuan', 'medicalRecord.visit:id,tanggal')->latest()->get();
    }

    public function invoices(Request $r)
    {
        return Invoice::where('patient_id', $this->patient($r)->id)->with('items', 'payments', 'visit:id,tanggal,poli_id', 'visit.poli:id,nama')->latest()->paginate(10);
    }

    // ---------- Notifikasi ----------
    public function notifications(Request $r) { return AppNotification::where('user_id', $r->user()->id)->latest()->paginate(15); }

    public function read(Request $r, int $id)
    {
        AppNotification::where('user_id', $r->user()->id)->whereKey($id)->whereNull('dibaca_at')->update(['dibaca_at' => now()]);
        return ['message' => 'ok'];
    }

    public function readAll(Request $r)
    {
        AppNotification::where('user_id', $r->user()->id)->whereNull('dibaca_at')->update(['dibaca_at' => now()]);
        return ['message' => 'ok'];
    }

    // ---------- Ulasan ----------
    public function reviews(Request $r)
    {
        $p = $this->patient($r);
        $sudah = Review::where('patient_id', $p->id)->pluck('visit_id');
        return [
            'ulasan' => Review::where('patient_id', $p->id)->latest()->get(),
            'bisa_diulas' => Visit::where('patient_id', $p->id)->where('status', 'selesai')->whereNotIn('id', $sudah)->with($this->withRel())
                ->orderByDesc('tanggal')->take(10)->get()->map(fn ($v) => $this->summary($v)),
        ];
    }

    public function storeReview(Request $r)
    {
        $d = $r->validate(['visit_id' => 'required|exists:visits,id', 'rating' => 'required|integer|between:1,5', 'ulasan' => 'nullable|string|max:500']);
        $v = $this->mine($r, Visit::findOrFail($d['visit_id']));
        abort_unless($v->status === 'selesai', 422, 'Ulasan hanya untuk kunjungan yang sudah selesai.');
        abort_if(Review::where('visit_id', $v->id)->exists(), 422, 'Kunjungan ini sudah Anda ulas.');
        $rev = Review::create(['patient_id' => $v->patient_id, 'visit_id' => $v->id, 'rating' => $d['rating'], 'ulasan' => $d['ulasan'] ?? null, 'tampil' => false]);
        return response()->json($rev, 201);
    }

    /** Pasien melaporkan pembayaran (transfer/QRIS). Admin memverifikasi sebelum tagihan lunas. */
    public function payInvoice(Request $r, Invoice $invoice)
    {
        abort_unless($invoice->patient_id === $this->patient($r)->id, 404, 'Data tidak ditemukan.');
        $d = $r->validate(['metode' => 'required|in:transfer,qris', 'jumlah' => 'required|numeric|min:1', 'bukti' => 'required|string|max:100']);
        $pay = \Illuminate\Support\Facades\DB::transaction(function () use ($invoice, $d) {
            $inv = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            abort_if($inv->status === 'lunas', 422, 'Tagihan ini sudah lunas.');
            abort_if($inv->payments()->where('status', 'menunggu_verifikasi')->exists(), 422, 'Sudah ada pembayaran yang menunggu verifikasi.');
            $sisa = (float) $inv->total - $inv->dibayar();
            abort_if($d['jumlah'] > $sisa + 0.001, 422, 'Jumlah melebihi sisa tagihan ('.number_format($sisa, 0, ',', '.').').');
            return $inv->payments()->create(['jumlah' => $d['jumlah'], 'metode' => $d['metode'], 'bukti' => $d['bukti'], 'status' => 'menunggu_verifikasi']);
        });
        \App\Models\User::whereHas('role', fn ($q) => $q->where('slug', 'admin_klinik'))->get()->each(fn ($u) => AppNotification::create([
            'user_id' => $u->id, 'tipe' => 'pembayaran', 'judul' => 'Pembayaran menunggu verifikasi', 'pesan' => "Invoice {$invoice->nomor}: pembayaran {$d['metode']} perlu diverifikasi."]));
        return response()->json($pay, 201);
    }
}
