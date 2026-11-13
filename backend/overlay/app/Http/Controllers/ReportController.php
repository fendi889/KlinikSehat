<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Visit;
use App\Services\AuditService;
use App\Services\XlsxWriter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private const JENIS = ['pasien' => 'Laporan pasien', 'dokter' => 'Laporan dokter', 'kunjungan' => 'Laporan kunjungan', 'poli' => 'Laporan poli',
        'obat' => 'Laporan obat', 'pembayaran' => 'Laporan pembayaran', 'pendapatan' => 'Laporan pendapatan', 'pengeluaran' => 'Laporan pengeluaran'];

    /** Pemilik tidak melihat laporan data pasien; nama pasien diganti No. RM. */
    private function allowed(Request $r): array
    {
        return $r->user()->role->slug === 'pemilik' ? array_values(array_diff(array_keys(self::JENIS), ['pasien'])) : array_keys(self::JENIS);
    }

    public function index(Request $r) { return collect($this->allowed($r))->map(fn ($k) => ['kode' => $k, 'nama' => self::JENIS[$k]])->values(); }

    public function show(Request $r, string $jenis)
    {
        abort_unless(in_array($jenis, $this->allowed($r), true), 403, 'Anda tidak memiliki akses ke laporan ini.');
        $r->validate(['from' => 'nullable|date', 'to' => 'nullable|date', 'format' => 'nullable|in:json,csv,xlsx']);
        $to = $r->query('to', today()->toDateString());
        $from = $r->query('from', today()->subDays(29)->toDateString());
        abort_if($from > $to, 422, 'Tanggal awal tidak boleh setelah tanggal akhir.');
        $nama = in_array($r->user()->role->slug, ['admin_klinik', 'super_admin'], true);

        $rep = $this->{'r'.ucfirst($jenis)}($from, $to, $nama) + ['judul' => self::JENIS[$jenis], 'dari' => $from, 'sampai' => $to];
        $fmt = $r->query('format', 'json');
        if ($fmt === 'json') return $rep;
        AuditService::log('laporan.ekspor', $jenis, ['format' => $fmt, 'dari' => $from, 'sampai' => $to]);
        return $fmt === 'csv' ? $this->csv($rep, $jenis) : $this->xlsx($rep, $jenis);
    }

    // ---------- Ekspor ----------
    private function csv(array $rep, string $jenis)
    {
        $safe = fn ($v) => is_string($v) && preg_match('/^[=+\-@\t\r]/', $v) ? "'".$v : $v;
        return response()->streamDownload(function () use ($rep, $safe) {
            $o = fopen('php://output', 'w');
            fwrite($o, "\xEF\xBB\xBF");
            fputcsv($o, [$rep['judul']], ';'); fputcsv($o, ['Periode', $rep['dari'].' s.d. '.$rep['sampai']], ';');
            foreach ($rep['ringkasan'] as $k => $v) fputcsv($o, [$k, $safe($v)], ';');
            fputcsv($o, [], ';'); fputcsv($o, $rep['kolom'], ';');
            foreach ($rep['baris'] as $b) fputcsv($o, array_map($safe, $b), ';');
            fclose($o);
        }, "laporan-{$jenis}-".now()->format('Ymd').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function xlsx(array $rep, string $jenis)
    {
        abort_unless(class_exists(\ZipArchive::class), 501, 'Ekstensi PHP "zip" belum aktif. Aktifkan di php.ini atau gunakan ekspor CSV.');
        $rows = [[[$rep['judul']], 1], [['Periode', $rep['dari'].' s.d. '.$rep['sampai']]]];
        foreach ($rep['ringkasan'] as $k => $v) $rows[] = [[$k, $v]];
        $rows[] = [[]]; $rows[] = [$rep['kolom'], 1];
        foreach ($rep['baris'] as $b) $rows[] = [$b];
        $path = XlsxWriter::build($rows, mb_substr($rep['judul'], 0, 31));
        return response()->download($path, "laporan-{$jenis}-".now()->format('Ymd').'.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])->deleteFileAfterSend(true);
    }

    // ---------- Isi laporan ----------
    private function range(string $from, string $to): array { return ["$from 00:00:00", "$to 23:59:59"]; }

    private function rPasien(string $from, string $to, bool $nama): array
    {
        $rows = Patient::whereBetween('created_at', $this->range($from, $to))->orderBy('created_at')->get();
        return ['kolom' => ['No. RM', 'Nama', 'JK', 'Tanggal lahir', 'Tanggal daftar'],
            'baris' => $rows->map(fn ($p) => [$p->no_rm, $p->nama, $p->jenis_kelamin, $p->tgl_lahir, $p->created_at->format('Y-m-d')])->all(),
            'ringkasan' => ['Pasien baru pada periode' => $rows->count(), 'Total pasien terdaftar' => Patient::count()]];
    }

    private function rDokter(string $from, string $to, bool $nama): array
    {
        $rev = DB::table('invoices')->join('visits', 'visits.id', '=', 'invoices.visit_id')->where('invoices.status', 'lunas')->whereBetween('visits.tanggal', [$from, $to])
            ->selectRaw('visits.doctor_id as k, sum(invoices.total) as s')->groupBy('visits.doctor_id')->pluck('s', 'k');
        $rows = DB::table('doctors')->join('users', 'users.id', '=', 'doctors.user_id')->join('polis', 'polis.id', '=', 'doctors.poli_id')
            ->leftJoin('visits', fn ($j) => $j->on('visits.doctor_id', '=', 'doctors.id')->whereBetween('visits.tanggal', [$from, $to]))
            ->groupBy('doctors.id', 'users.name', 'polis.nama')->orderBy('users.name')
            ->get(['doctors.id', 'users.name as nama', 'polis.nama as poli', DB::raw('count(visits.id) as kunjungan'),
                DB::raw("count(visits.id) filter (where visits.status = 'selesai') as selesai"), DB::raw("count(visits.id) filter (where visits.status = 'batal') as batal")]);
        return ['kolom' => ['Dokter', 'Poli', 'Kunjungan', 'Selesai', 'Batal', 'Pendapatan (Rp)'],
            'baris' => $rows->map(fn ($d) => [$d->nama, $d->poli, (int) $d->kunjungan, (int) $d->selesai, (int) $d->batal, (float) ($rev[$d->id] ?? 0)])->all(),
            'ringkasan' => ['Total kunjungan' => (int) $rows->sum('kunjungan'), 'Total pendapatan (Rp)' => (float) $rev->sum()]];
    }

    private function rKunjungan(string $from, string $to, bool $nama): array
    {
        $rows = Visit::whereBetween('tanggal', [$from, $to])->with('patient:id,nama,no_rm', 'poli:id,nama', 'doctor.user:id,name', 'queue:id,visit_id,kode')->orderBy('tanggal')->orderBy('id')->limit(5000)->get();
        return ['kolom' => ['Tanggal', 'Antrian', $nama ? 'Pasien' : 'No. RM', 'Poli', 'Dokter', 'Status'],
            'baris' => $rows->map(fn ($v) => [$v->tanggal->toDateString(), $v->queue?->kode, $nama ? $v->patient->nama : $v->patient->no_rm, $v->poli->nama, $v->doctor->user->name, $v->status])->all(),
            'ringkasan' => ['Total kunjungan' => $rows->count(), 'Selesai' => $rows->where('status', 'selesai')->count(), 'Batal' => $rows->where('status', 'batal')->count()]];
    }

    private function rPoli(string $from, string $to, bool $nama): array
    {
        $rev = DB::table('invoices')->join('visits', 'visits.id', '=', 'invoices.visit_id')->where('invoices.status', 'lunas')->whereBetween('visits.tanggal', [$from, $to])
            ->selectRaw('visits.poli_id as k, sum(invoices.total) as s')->groupBy('visits.poli_id')->pluck('s', 'k');
        $rows = DB::table('polis')->leftJoin('visits', fn ($j) => $j->on('visits.poli_id', '=', 'polis.id')->whereBetween('visits.tanggal', [$from, $to]))
            ->groupBy('polis.id', 'polis.nama')->orderBy('polis.nama')
            ->get(['polis.id', 'polis.nama', DB::raw('count(visits.id) as kunjungan'), DB::raw("count(visits.id) filter (where visits.status = 'selesai') as selesai"), DB::raw("count(visits.id) filter (where visits.status = 'batal') as batal")]);
        return ['kolom' => ['Poli', 'Kunjungan', 'Selesai', 'Batal', 'Pendapatan (Rp)'],
            'baris' => $rows->map(fn ($p) => [$p->nama, (int) $p->kunjungan, (int) $p->selesai, (int) $p->batal, (float) ($rev[$p->id] ?? 0)])->all(),
            'ringkasan' => ['Total kunjungan' => (int) $rows->sum('kunjungan'), 'Total pendapatan (Rp)' => (float) $rev->sum()]];
    }

    private function rObat(string $from, string $to, bool $nama): array
    {
        $gerak = DB::table('stock_movements')->join('medicine_batches', 'medicine_batches.id', '=', 'stock_movements.batch_id')->whereBetween('stock_movements.created_at', $this->range($from, $to))
            ->selectRaw("medicine_batches.medicine_id as k, sum(case when stock_movements.jenis = 'masuk' then stock_movements.jumlah else 0 end) as masuk, sum(case when stock_movements.jumlah < 0 then -stock_movements.jumlah else 0 end) as keluar")
            ->groupBy('medicine_batches.medicine_id')->get()->keyBy('k');
        $meds = Medicine::selectRaw('medicines.*, (select coalesce(sum(b.stok), 0) from medicine_batches b where b.medicine_id = medicines.id and b.tgl_kedaluwarsa >= current_date) as stok_aktif')->orderBy('nama')->get();
        return ['kolom' => ['Kode', 'Obat', 'Satuan', 'Masuk', 'Keluar', 'Stok aktif', 'Stok minimum'],
            'baris' => $meds->map(fn ($m) => [$m->kode, $m->nama, $m->satuan, (int) ($gerak[$m->id]->masuk ?? 0), (int) ($gerak[$m->id]->keluar ?? 0), (int) $m->stok_aktif, (int) $m->stok_minimum])->all(),
            'ringkasan' => ['Jenis obat' => $meds->count(), 'Total masuk' => (int) $gerak->sum('masuk'), 'Total keluar' => (int) $gerak->sum('keluar'), 'Di bawah stok minimum' => $meds->filter(fn ($m) => (int) $m->stok_aktif < $m->stok_minimum)->count()]];
    }

    private function rPembayaran(string $from, string $to, bool $nama): array
    {
        $rows = DB::table('payments')->join('invoices', 'invoices.id', '=', 'payments.invoice_id')->join('patients', 'patients.id', '=', 'invoices.patient_id')
            ->whereBetween('payments.created_at', $this->range($from, $to))->orderBy('payments.created_at')->limit(5000)
            ->get(['payments.created_at', 'invoices.nomor', 'patients.nama', 'patients.no_rm', 'payments.metode', 'payments.jumlah', 'payments.status']);
        $ok = $rows->where('status', 'terverifikasi');
        return ['kolom' => ['Waktu', 'Invoice', $nama ? 'Pasien' : 'No. RM', 'Metode', 'Jumlah (Rp)', 'Status'],
            'baris' => $rows->map(fn ($p) => [$p->created_at, $p->nomor, $nama ? $p->nama : $p->no_rm, $p->metode, (float) $p->jumlah, $p->status])->all(),
            'ringkasan' => ['Jumlah transaksi' => $rows->count(), 'Total terverifikasi (Rp)' => (float) $ok->sum('jumlah'), 'Menunggu verifikasi' => $rows->where('status', 'menunggu_verifikasi')->count()]];
    }

    private function rPendapatan(string $from, string $to, bool $nama): array
    {
        $q = DB::table('payments')->where('status', 'terverifikasi')->whereBetween('created_at', $this->range($from, $to));
        $harian = (clone $q)->selectRaw('date(created_at) as tgl, count(*) as n, sum(jumlah) as total')->groupBy(DB::raw('date(created_at)'))->orderBy('tgl')->get();
        $metode = (clone $q)->selectRaw('metode, sum(jumlah) as total')->groupBy('metode')->pluck('total', 'metode');
        $ringkas = ['Total pendapatan (Rp)' => (float) $harian->sum('total'), 'Jumlah transaksi' => (int) $harian->sum('n')];
        foreach ($metode as $m => $t) $ringkas['Metode '.$m.' (Rp)'] = (float) $t;
        return ['kolom' => ['Tanggal', 'Jumlah transaksi', 'Total (Rp)'], 'baris' => $harian->map(fn ($h) => [$h->tgl, (int) $h->n, (float) $h->total])->all(), 'ringkasan' => $ringkas];
    }

    private function rPengeluaran(string $from, string $to, bool $nama): array
    {
        $rows = Expense::whereBetween('tanggal', [$from, $to])->orderBy('tanggal')->get();
        $ringkas = ['Total pengeluaran (Rp)' => (float) $rows->sum('jumlah')];
        foreach ($rows->groupBy('kategori') as $k => $g) $ringkas['Kategori '.$k.' (Rp)'] = (float) $g->sum('jumlah');
        return ['kolom' => ['Tanggal', 'Kategori', 'Keterangan', 'Jumlah (Rp)'], 'baris' => $rows->map(fn ($e) => [$e->tanggal, $e->kategori, $e->keterangan, (float) $e->jumlah])->all(), 'ringkasan' => $ringkas];
    }
}
