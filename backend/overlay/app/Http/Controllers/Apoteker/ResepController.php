<?php

namespace App\Http\Controllers\Apoteker;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\MedicineBatch;
use App\Models\Prescription;
use App\Models\StockMovement;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResepController extends Controller
{
    private function load(Prescription $rx): Prescription
    {
        return $rx->load('items.medicine:id,kode,nama,satuan,harga_jual', 'medicalRecord.patient:id,nama,no_rm,alergi,user_id', 'medicalRecord.visit:id,tanggal', 'medicalRecord.doctor.user:id,name');
    }

    private function notify(Prescription $rx, string $judul, string $pesan): void
    {
        if ($uid = $rx->medicalRecord?->patient?->user_id) AppNotification::create(['user_id' => $uid, 'tipe' => 'resep', 'judul' => $judul, 'pesan' => $pesan]);
    }

    public function index(Request $r)
    {
        $status = $r->query('status', 'aktif');
        $q = Prescription::query()->latest('id');
        $status === 'aktif' ? $q->whereIn('status', ['baru', 'diproses', 'siap']) : ($status === 'semua' ? null : $q->where('status', $status));
        $page = $q->paginate(10);
        $page->getCollection()->transform(fn ($rx) => $this->load($rx));

        $ids = $page->getCollection()->flatMap(fn ($rx) => $rx->items->pluck('medicine_id'))->unique();
        $stok = MedicineBatch::whereIn('medicine_id', $ids)->where('tgl_kedaluwarsa', '>=', today()->toDateString())
            ->selectRaw('medicine_id, sum(stok) as s')->groupBy('medicine_id')->pluck('s', 'medicine_id');

        return $page->through(function ($rx) use ($stok) {
            $p = $rx->medicalRecord->patient;
            $alergi = mb_strtolower((string) $p->alergi);
            $items = $rx->items->map(fn ($i) => [
                'id' => $i->id, 'nama' => $i->medicine->nama, 'satuan' => $i->medicine->satuan, 'jumlah' => $i->jumlah, 'aturan_pakai' => $i->aturan_pakai,
                'harga_jual' => $i->medicine->harga_jual, 'stok_tersedia' => (int) ($stok[$i->medicine_id] ?? 0), 'cukup' => (int) ($stok[$i->medicine_id] ?? 0) >= $i->jumlah,
                'peringatan_alergi' => $alergi !== '' && str_contains($alergi, mb_strtolower(strtok($i->medicine->nama, ' '))),
            ]);
            return ['id' => $rx->id, 'status' => $rx->status, 'tanggal' => $rx->medicalRecord->visit?->tanggal?->toDateString(), 'dokter' => $rx->medicalRecord->doctor?->user?->name,
                'pasien' => $p->nama, 'no_rm' => $p->no_rm, 'alergi' => $p->alergi, 'items' => $items, 'semua_cukup' => $items->every(fn ($i) => $i['cukup'])];
        });
    }

    public function process(Request $r, Prescription $prescription)
    {
        abort_unless($prescription->status === 'baru', 422, 'Resep ini sudah diproses.');
        $prescription->update(['status' => 'diproses', 'pharmacist_id' => $r->user()->id]);
        return ['message' => 'Resep mulai diproses.'];
    }

    /** Menyiapkan obat: stok berkurang otomatis dengan FEFO (batch kedaluwarsa terdekat lebih dulu), lalu biaya obat masuk ke tagihan. */
    public function ready(Request $r, Prescription $prescription)
    {
        abort_unless(in_array($prescription->status, ['baru', 'diproses'], true), 422, 'Obat untuk resep ini sudah disiapkan.');

        DB::transaction(function () use ($prescription, $r) {
            $rx = Prescription::whereKey($prescription->id)->lockForUpdate()->first();
            abort_unless(in_array($rx->status, ['baru', 'diproses'], true), 422, 'Obat untuk resep ini sudah disiapkan.');
            $rx->load('items.medicine:id,nama,satuan,harga_jual');

            $butuh = $rx->items->groupBy('medicine_id')->map(fn ($g) => (int) $g->sum('jumlah')); // satu obat bisa muncul dua kali
            $alokasi = []; $kurang = [];
            foreach ($butuh as $medId => $need) {
                $batches = MedicineBatch::where('medicine_id', $medId)->where('stok', '>', 0)->where('tgl_kedaluwarsa', '>=', today()->toDateString())
                    ->orderBy('tgl_kedaluwarsa')->orderBy('id')->lockForUpdate()->get();
                foreach ($batches as $b) {
                    if ($need <= 0) break;
                    $take = min($b->stok, $need);
                    $alokasi[] = [$b, $take]; $need -= $take;
                }
                if ($need > 0) $kurang[] = $rx->items->firstWhere('medicine_id', $medId)->medicine->nama." (kurang {$need})";
            }
            abort_if($kurang, 422, 'Stok tidak cukup: '.implode(', ', $kurang).'. Tambahkan stok masuk terlebih dahulu.');

            foreach ($alokasi as [$b, $take]) {
                $b->update(['stok' => $b->stok - $take]);
                StockMovement::create(['batch_id' => $b->id, 'jenis' => 'keluar', 'jumlah' => -$take, 'keterangan' => "Resep #{$rx->id} (FEFO)", 'ref_type' => Prescription::class, 'ref_id' => $rx->id, 'user_id' => $r->user()->id]);
            }

            $mr = $rx->medicalRecord;
            $inv = Invoice::where('visit_id', $mr->visit_id)->where('status', 'belum_bayar')->lockForUpdate()->first();
            if ($inv && !$inv->items()->where('deskripsi', 'like', "Obat (resep #{$rx->id})%")->exists()) {
                foreach ($rx->items as $i) InvoiceItem::create(['invoice_id' => $inv->id, 'deskripsi' => "Obat (resep #{$rx->id}): {$i->medicine->nama}", 'qty' => $i->jumlah, 'harga' => $i->medicine->harga_jual]);
                $sub = (float) $inv->items()->sum(DB::raw('qty * harga'));
                $inv->update(['subtotal' => $sub, 'total' => max(0, $sub - (float) $inv->diskon)]);
            }
            $rx->update(['status' => 'siap', 'pharmacist_id' => $r->user()->id]);
        });

        AuditService::log('resep.siap', 'prescription:'.$prescription->id);
        $this->notify($prescription->fresh(), 'Obat siap diambil', 'Obat Anda sudah disiapkan. Silakan ambil di apotek.');
        return ['message' => 'Obat disiapkan. Stok berkurang otomatis (FEFO).'];
    }

    public function dispense(Prescription $prescription)
    {
        abort_unless($prescription->status === 'siap', 422, 'Siapkan obat terlebih dahulu.');
        $prescription->update(['status' => 'diserahkan']);
        $this->notify($prescription, 'Obat telah diserahkan', 'Obat Anda sudah diserahkan. Ikuti aturan pakai dari dokter.');
        return ['message' => 'Obat diserahkan kepada pasien.'];
    }
}
