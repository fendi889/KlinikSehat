<?php

namespace App\Http\Controllers\Pemilik;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PemilikController extends Controller
{
    private const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    private function range(Request $r): array
    {
        $r->validate(['from' => 'nullable|date', 'to' => 'nullable|date']);
        $to = $r->query('to', now()->toDateString());
        $from = $r->query('from', now()->subDays(29)->toDateString());
        abort_if($from > $to, 422, 'Tanggal awal tidak boleh setelah tanggal akhir.');
        return [$from, $to];
    }

    private function pendapatan(string $from, string $to): float
    {
        return (float) DB::table('payments')->where('status', 'terverifikasi')
            ->whereBetween('created_at', ["$from 00:00:00", "$to 23:59:59"])->sum('jumlah');
    }

    private function pengeluaran(string $from, string $to): float
    {
        return (float) DB::table('expenses')->whereBetween('tanggal', [$from, $to])->sum('jumlah');
    }

    /** Pendapatan dan pengeluaran 6 bulan terakhir (termasuk bulan ini). */
    private function bulanan(): array
    {
        $out = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = now()->startOfMonth()->subMonths($i);
            $from = $m->toDateString();
            $to = $m->copy()->endOfMonth()->toDateString();
            $p = $this->pendapatan($from, $to);
            $k = $this->pengeluaran($from, $to);
            $out[] = ['label' => self::BULAN[$m->month - 1].' '.$m->format('y'), 'pendapatan' => $p, 'pengeluaran' => $k, 'keuntungan' => $p - $k];
        }
        return $out;
    }

    public function finance(Request $r)
    {
        [$from, $to] = $this->range($r);
        $p = $this->pendapatan($from, $to);
        $k = $this->pengeluaran($from, $to);
        return [
            'dari' => $from, 'sampai' => $to, 'pendapatan' => $p, 'pengeluaran' => $k, 'keuntungan' => $p - $k,
            'per_kategori' => DB::table('expenses')->whereBetween('tanggal', [$from, $to])->groupBy('kategori')
                ->orderByDesc(DB::raw('sum(jumlah)'))->get(['kategori', DB::raw('sum(jumlah) as jumlah')]),
            'per_metode' => DB::table('payments')->where('status', 'terverifikasi')->whereBetween('created_at', ["$from 00:00:00", "$to 23:59:59"])
                ->groupBy('metode')->get(['metode', DB::raw('sum(jumlah) as jumlah')]),
            'bulanan' => $this->bulanan(),
        ];
    }

    public function performance(Request $r)
    {
        [$from, $to] = $this->range($r);

        $revenue = fn (string $col) => DB::table('invoices')->join('visits', 'visits.id', '=', 'invoices.visit_id')
            ->where('invoices.status', 'lunas')->whereBetween('visits.tanggal', [$from, $to])
            ->selectRaw("visits.$col as k, sum(invoices.total) as s")->groupBy("visits.$col")->pluck('s', 'k');

        $revDoc = $revenue('doctor_id');
        $revPoli = $revenue('poli_id');

        $doctors = DB::table('doctors')->join('users', 'users.id', '=', 'doctors.user_id')->join('polis', 'polis.id', '=', 'doctors.poli_id')
            ->leftJoin('visits', fn ($j) => $j->on('visits.doctor_id', '=', 'doctors.id')->whereBetween('visits.tanggal', [$from, $to]))
            ->groupBy('doctors.id', 'users.name', 'polis.nama')->orderByDesc(DB::raw('count(visits.id)'))
            ->get(['doctors.id', 'users.name as nama', 'polis.nama as poli', DB::raw('count(visits.id) as kunjungan'),
                DB::raw("count(visits.id) filter (where visits.status = 'selesai') as selesai")])
            ->map(fn ($d) => (array) $d + ['pendapatan' => (float) ($revDoc[$d->id] ?? 0)]);

        $polis = DB::table('polis')
            ->leftJoin('visits', fn ($j) => $j->on('visits.poli_id', '=', 'polis.id')->whereBetween('visits.tanggal', [$from, $to]))
            ->groupBy('polis.id', 'polis.nama')->orderByDesc(DB::raw('count(visits.id)'))
            ->get(['polis.id', 'polis.nama', DB::raw('count(visits.id) as kunjungan'),
                DB::raw("count(visits.id) filter (where visits.status = 'selesai') as selesai")])
            ->map(fn ($p) => (array) $p + ['pendapatan' => (float) ($revPoli[$p->id] ?? 0)]);

        return ['dari' => $from, 'sampai' => $to, 'dokter' => $doctors, 'poli' => $polis];
    }

    public function charts(Request $r)
    {
        $days = min(max((int) $r->query('days', 30), 7), 90);
        $start = now()->subDays($days - 1)->toDateString();
        $count = DB::table('visits')->whereBetween('tanggal', [$start, now()->toDateString()])->selectRaw('tanggal, count(*) as c')->groupBy('tanggal')->pluck('c', 'tanggal');
        $harian = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $d = now()->subDays($i);
            $harian[] = ['tanggal' => $d->toDateString(), 'label' => $d->format('d/m'), 'jumlah' => (int) ($count[$d->toDateString()] ?? 0)];
        }
        return ['kunjungan_harian' => $harian, 'bulanan' => $this->bulanan()];
    }

    /** Kondisi operasional hari ini. */
    public function monitoring()
    {
        $today = now()->toDateString();
        return [
            'kunjungan_hari_ini' => DB::table('visits')->where('tanggal', $today)->selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status'),
            'antrian_hari_ini' => DB::table('queues')->where('tanggal', $today)->selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status'),
            'invoice_belum_bayar' => [
                'jumlah' => DB::table('invoices')->where('status', 'belum_bayar')->count(),
                'total' => (float) DB::table('invoices')->where('status', 'belum_bayar')->sum('total'),
            ],
            'stok_rendah' => DB::table('medicines')->leftJoin('medicine_batches', 'medicine_batches.medicine_id', '=', 'medicines.id')
                ->groupBy('medicines.id', 'medicines.nama', 'medicines.stok_minimum')
                ->havingRaw('coalesce(sum(medicine_batches.stok), 0) < medicines.stok_minimum')
                ->get(['medicines.nama', 'medicines.stok_minimum', DB::raw('coalesce(sum(medicine_batches.stok), 0) as stok')]),
            'segera_kedaluwarsa' => DB::table('medicine_batches')->join('medicines', 'medicines.id', '=', 'medicine_batches.medicine_id')
                ->where('medicine_batches.stok', '>', 0)->where('medicine_batches.tgl_kedaluwarsa', '<=', now()->addDays(30)->toDateString())
                ->orderBy('medicine_batches.tgl_kedaluwarsa')->get(['medicines.nama', 'medicine_batches.no_batch', 'medicine_batches.tgl_kedaluwarsa', 'medicine_batches.stok']),
            'diperbarui' => now()->toIso8601String(),
        ];
    }

    /** Ringkasan Dashboard Pemilik: kartu statistik + tren, grafik kunjungan, dan antrian hari ini. */
    public function overview()
    {
        $pct = fn ($now, $before) => $before > 0 ? (int) round(($now - $before) / $before * 100) : null;
        $awal = now()->startOfMonth();
        $awalLalu = $awal->copy()->subMonthNoOverflow();
        $akhirLalu = $awalLalu->copy()->addDays(now()->day - 1)->min($awalLalu->copy()->endOfMonth())->endOfDay();
        $today = today()->toDateString();

        $pasienBaru = DB::table('patients')->where('created_at', '>=', $awal)->count();
        $pasienBaruLalu = DB::table('patients')->whereBetween('created_at', [$awalLalu, $akhirLalu])->count();
        $antrian = DB::table('queues')->where('tanggal', $today)->count();
        $antrianKemarin = DB::table('queues')->where('tanggal', today()->subDay()->toDateString())->count();
        $bayar = fn ($a, $b) => (float) DB::table('payments')->where('status', 'terverifikasi')->whereBetween('created_at', [$a, $b])->sum('jumlah');
        $bayarIni = $bayar($awal, now());
        $bayarLalu = $bayar($awalLalu, $akhirLalu);

        $bulanan = [];
        for ($i = 11; $i >= 0; $i--) {
            $m = now()->startOfMonth()->subMonths($i);
            $bulanan[] = ['label' => self::BULAN[$m->month - 1], 'jumlah' => DB::table('visits')->whereBetween('tanggal', [$m->toDateString(), $m->copy()->endOfMonth()->toDateString()])->count()];
        }

        return [
            'pasien' => ['total' => DB::table('patients')->count(), 'trend' => $pct($pasienBaru, $pasienBaruLalu)],
            'dokter' => ['total' => DB::table('doctors')->count()],
            'antrian' => ['hari_ini' => $antrian, 'trend' => $pct($antrian, $antrianKemarin), 'menunggu' => DB::table('queues')->where('tanggal', $today)->where('status', 'menunggu')->count()],
            'pendapatan' => ['bulan_ini' => $bayarIni, 'trend' => $pct($bayarIni, $bayarLalu)],
            'kunjungan_bulanan' => $bulanan,
            'kunjungan_harian' => $this->charts(request())['kunjungan_harian'],
        ];
    }
}
