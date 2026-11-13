<?php

namespace App\Http\Controllers\Apoteker;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\MedicineBatch;
use App\Models\StockMovement;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StokController extends Controller
{
    private function statusBatch(MedicineBatch $b): string
    {
        $tgl = $b->tgl_kedaluwarsa instanceof \DateTimeInterface ? $b->tgl_kedaluwarsa->format('Y-m-d') : (string) $b->tgl_kedaluwarsa;
        if ($b->stok <= 0) return 'habis';
        if ($tgl < today()->toDateString()) return 'kedaluwarsa';
        if ($tgl <= today()->addDays(30)->toDateString()) return 'segera';
        return 'aktif';
    }

    private function batchQuery(Request $r)
    {
        $q = MedicineBatch::with('medicine:id,kode,nama,satuan')->orderBy('tgl_kedaluwarsa')->orderBy('id');
        if ($r->filled('medicine_id')) $q->where('medicine_id', $r->query('medicine_id'));
        if ($s = $r->query('q')) $q->whereHas('medicine', fn ($w) => $w->where('nama', 'ilike', "%$s%")->orWhere('kode', 'ilike', "%$s%"));
        $today = today()->toDateString();
        match ($r->query('status')) {
            'aktif' => $q->where('stok', '>', 0)->where('tgl_kedaluwarsa', '>=', $today),
            'habis' => $q->where('stok', '<=', 0),
            'kedaluwarsa' => $q->where('stok', '>', 0)->where('tgl_kedaluwarsa', '<', $today),
            'segera' => $q->where('stok', '>', 0)->whereBetween('tgl_kedaluwarsa', [$today, today()->addDays(30)->toDateString()]),
            default => null,
        };
        return $q;
    }

    private function flatBatch(MedicineBatch $b): array
    {
        return ['id' => $b->id, 'medicine_id' => $b->medicine_id, 'obat' => $b->medicine?->nama, 'kode' => $b->medicine?->kode, 'satuan' => $b->medicine?->satuan,
            'no_batch' => $b->no_batch, 'tgl_kedaluwarsa' => $b->tgl_kedaluwarsa instanceof \DateTimeInterface ? $b->tgl_kedaluwarsa->format('Y-m-d') : $b->tgl_kedaluwarsa,
            'stok' => $b->stok, 'harga_beli' => $b->harga_beli, 'status' => $this->statusBatch($b)];
    }

    public function batches(Request $r) { return $this->batchQuery($r)->paginate(15)->through(fn ($b) => $this->flatBatch($b)); }

    /** Stok masuk: membuat batch baru atau menambah batch yang sudah ada (tanggal kedaluwarsa harus sama). */
    public function stockIn(Request $r)
    {
        $d = $r->validate([
            'medicine_id' => 'required|exists:medicines,id', 'no_batch' => 'required|string|max:50', 'tgl_kedaluwarsa' => 'required|date|after:today',
            'jumlah' => 'required|integer|between:1,100000', 'harga_beli' => 'required|numeric|min:0|max:100000000', 'keterangan' => 'nullable|string|max:200',
        ]);
        $batch = DB::transaction(function () use ($d, $r) {
            $b = MedicineBatch::where('medicine_id', $d['medicine_id'])->where('no_batch', $d['no_batch'])->lockForUpdate()->first();
            if ($b) {
                abort_if(substr((string) $b->tgl_kedaluwarsa, 0, 10) !== $d['tgl_kedaluwarsa'], 422, 'Batch ini sudah ada dengan tanggal kedaluwarsa berbeda. Gunakan nomor batch lain.');
                $b->update(['stok' => $b->stok + $d['jumlah'], 'harga_beli' => $d['harga_beli']]);
            } else {
                $b = MedicineBatch::create(['medicine_id' => $d['medicine_id'], 'no_batch' => $d['no_batch'], 'tgl_kedaluwarsa' => $d['tgl_kedaluwarsa'], 'stok' => $d['jumlah'], 'harga_beli' => $d['harga_beli']]);
            }
            StockMovement::create(['batch_id' => $b->id, 'jenis' => 'masuk', 'jumlah' => $d['jumlah'], 'keterangan' => $d['keterangan'] ?? 'Stok masuk', 'user_id' => $r->user()->id]);
            return $b;
        });
        AuditService::log('stok.masuk', 'batch:'.$batch->id, ['jumlah' => $d['jumlah']]);
        return response()->json($this->flatBatch($batch->load('medicine:id,kode,nama,satuan')), 201);
    }

    /** Stok keluar manual (rusak/dibuang) atau koreksi hasil opname. Alasan wajib diisi. */
    public function adjust(Request $r)
    {
        $d = $r->validate([
            'batch_id' => 'required|exists:medicine_batches,id', 'jenis' => 'required|in:keluar,koreksi',
            'jumlah' => 'required|integer|not_in:0|between:-100000,100000', 'keterangan' => 'required|string|max:200',
        ]);
        abort_if($d['jenis'] === 'keluar' && $d['jumlah'] < 0, 422, 'Jumlah stok keluar harus berupa angka positif.');
        $delta = $d['jenis'] === 'keluar' ? -$d['jumlah'] : $d['jumlah'];

        $batch = DB::transaction(function () use ($d, $delta, $r) {
            $b = MedicineBatch::whereKey($d['batch_id'])->lockForUpdate()->firstOrFail();
            abort_if($b->stok + $delta < 0, 422, "Stok batch tidak cukup (tersisa {$b->stok}).");
            $b->update(['stok' => $b->stok + $delta]);
            StockMovement::create(['batch_id' => $b->id, 'jenis' => $d['jenis'], 'jumlah' => $delta, 'keterangan' => $d['keterangan'], 'user_id' => $r->user()->id]);
            return $b;
        });
        AuditService::log('stok.'.$d['jenis'], 'batch:'.$batch->id, ['jumlah' => $delta, 'alasan' => $d['keterangan']]);
        return $this->flatBatch($batch->load('medicine:id,kode,nama,satuan'));
    }

    private function movementQuery(Request $r)
    {
        $q = StockMovement::with('batch.medicine:id,kode,nama,satuan', 'user:id,name')->latest('id');
        if ($r->filled('medicine_id')) $q->whereHas('batch', fn ($w) => $w->where('medicine_id', $r->query('medicine_id')));
        if ($r->filled('jenis')) $q->where('jenis', $r->query('jenis'));
        if ($r->filled('from')) $q->where('created_at', '>=', $r->query('from').' 00:00:00');
        if ($r->filled('to')) $q->where('created_at', '<=', $r->query('to').' 23:59:59');
        return $q;
    }

    private function flatMove(StockMovement $m): array
    {
        return ['id' => $m->id, 'waktu' => $m->created_at->toIso8601String(), 'obat' => $m->batch?->medicine?->nama, 'satuan' => $m->batch?->medicine?->satuan, 'no_batch' => $m->batch?->no_batch,
            'jenis' => $m->jenis, 'jumlah' => $m->jumlah, 'keterangan' => $m->keterangan, 'petugas' => $m->user?->name];
    }

    public function movements(Request $r)
    {
        $r->validate(['from' => 'nullable|date', 'to' => 'nullable|date']);
        return $this->movementQuery($r)->paginate(20)->through(fn ($m) => $this->flatMove($m));
    }

    public function alerts()
    {
        $today = today()->toDateString();
        return [
            'stok_rendah' => Medicine::selectRaw('medicines.id, medicines.kode, medicines.nama, medicines.satuan, medicines.stok_minimum, (select coalesce(sum(b.stok), 0) from medicine_batches b where b.medicine_id = medicines.id and b.tgl_kedaluwarsa >= current_date) as stok')
                ->whereRaw('(select coalesce(sum(b.stok), 0) from medicine_batches b where b.medicine_id = medicines.id and b.tgl_kedaluwarsa >= current_date) < medicines.stok_minimum')->orderBy('nama')->get(),
            'kedaluwarsa' => MedicineBatch::with('medicine:id,kode,nama,satuan')->where('stok', '>', 0)->where('tgl_kedaluwarsa', '<', $today)->orderBy('tgl_kedaluwarsa')->get()->map(fn ($b) => $this->flatBatch($b)),
            'segera' => MedicineBatch::with('medicine:id,kode,nama,satuan')->where('stok', '>', 0)->whereBetween('tgl_kedaluwarsa', [$today, today()->addDays(30)->toDateString()])->orderBy('tgl_kedaluwarsa')->get()->map(fn ($b) => $this->flatBatch($b)),
        ];
    }

    // ---------- Ekspor (CSV, dibuka langsung di Excel) ----------
    private function safe(mixed $v): mixed
    {
        return is_string($v) && preg_match('/^[=+\-@\t\r]/', $v) ? "'".$v : $v; // cegah formula injection di Excel
    }

    public function export(Request $r, string $jenis)
    {
        abort_unless(in_array($jenis, ['obat', 'batch', 'riwayat'], true), 404);
        $r->validate(['from' => 'nullable|date', 'to' => 'nullable|date']);
        $nama = "{$jenis}-".now()->format('Ymd-His').'.csv';
        AuditService::log('ekspor.'.$jenis, null, [], $r->user()->id);

        return response()->streamDownload(function () use ($jenis, $r) {
            $o = fopen('php://output', 'w');
            fwrite($o, "\xEF\xBB\xBF"); // BOM agar Excel membaca UTF-8
            $row = fn (array $a) => fputcsv($o, array_map(fn ($x) => $this->safe($x), $a), ';');
            if ($jenis === 'obat') {
                $row(['Kode', 'Nama', 'Kategori', 'Satuan', 'Harga jual', 'Stok aktif', 'Stok minimum', 'Status']);
                Medicine::with('category:id,nama')->selectRaw('medicines.*, (select coalesce(sum(b.stok), 0) from medicine_batches b where b.medicine_id = medicines.id and b.tgl_kedaluwarsa >= current_date) as stok')
                    ->orderBy('nama')->chunk(200, fn ($ms) => $ms->each(fn ($m) => $row([$m->kode, $m->nama, $m->category?->nama, $m->satuan, $m->harga_jual, (int) $m->stok, $m->stok_minimum, (int) $m->stok < $m->stok_minimum ? 'Di bawah minimum' : 'Aman'])));
            } elseif ($jenis === 'batch') {
                $row(['Kode', 'Obat', 'No. batch', 'Kedaluwarsa', 'Stok', 'Harga beli', 'Status']);
                $this->batchQuery($r)->chunk(200, fn ($bs) => $bs->each(function ($b) use ($row) { $f = $this->flatBatch($b); $row([$f['kode'], $f['obat'], $f['no_batch'], $f['tgl_kedaluwarsa'], $f['stok'], $f['harga_beli'], $f['status']]); }));
            } else {
                $row(['Waktu', 'Obat', 'No. batch', 'Jenis', 'Jumlah', 'Keterangan', 'Petugas']);
                $this->movementQuery($r)->chunk(200, fn ($ms) => $ms->each(function ($m) use ($row) { $f = $this->flatMove($m); $row([$f['waktu'], $f['obat'], $f['no_batch'], $f['jenis'], $f['jumlah'], $f['keterangan'], $f['petugas']]); }));
            }
            fclose($o);
        }, $nama, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
