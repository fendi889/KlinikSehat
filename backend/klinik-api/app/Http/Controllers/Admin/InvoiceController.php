<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Clinic;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Patient;
use App\Models\Payment;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    private function notify(Invoice $i, string $judul, string $pesan): void
    {
        if ($uid = Patient::whereKey($i->patient_id)->value('user_id')) AppNotification::create(['user_id' => $uid, 'tipe' => 'pembayaran', 'judul' => $judul, 'pesan' => $pesan]);
    }

    private function editable(Invoice $i): void
    {
        abort_if($i->status === 'lunas', 422, 'Tagihan sudah lunas dan tidak dapat diubah.');
        abort_if($i->payments()->whereIn('status', ['terverifikasi', 'menunggu_verifikasi'])->exists(), 422, 'Tagihan sudah memiliki pembayaran. Item dan diskon tidak dapat diubah.');
    }

    private function row(Invoice $i): array
    {
        return ['id' => $i->id, 'nomor' => $i->nomor, 'pasien' => $i->patient?->nama, 'no_rm' => $i->patient?->no_rm, 'tanggal' => $i->visit?->tanggal?->toDateString(),
            'poli' => $i->visit?->poli?->nama, 'total' => (float) $i->total, 'status' => $i->status, 'dibayar' => $i->dibayar(),
            'menunggu_verifikasi' => $i->payments()->where('status', 'menunggu_verifikasi')->exists()];
    }

    private function detail(Invoice $i): array
    {
        $i->load('items', 'payments.verifier:id,name', 'patient:id,nama,no_rm', 'visit:id,tanggal,poli_id,doctor_id', 'visit.poli:id,nama', 'visit.doctor.user:id,name');
        $paid = $i->dibayar();
        return $this->row($i) + [
            'subtotal' => (float) $i->subtotal, 'diskon' => (float) $i->diskon, 'sisa' => max(0, (float) $i->total - $paid), 'dokter' => $i->visit?->doctor?->user?->name,
            'items' => $i->items, 'pembayaran' => $i->payments->map(fn ($p) => ['id' => $p->id, 'jumlah' => (float) $p->jumlah, 'metode' => $p->metode, 'status' => $p->status, 'bukti' => $p->bukti,
                'waktu' => $p->created_at->toIso8601String(), 'verifikator' => $p->verifier?->name]),
            'klinik' => Clinic::first(['nama', 'alamat', 'telp']),
        ];
    }

    public function index(Request $r)
    {
        $r->validate(['from' => 'nullable|date', 'to' => 'nullable|date']);
        $q = Invoice::with('patient:id,nama,no_rm', 'visit:id,tanggal,poli_id', 'visit.poli:id,nama')->latest('id');
        if ($r->query('status') === 'menunggu') $q->whereHas('payments', fn ($w) => $w->where('status', 'menunggu_verifikasi'));
        elseif ($r->filled('status')) $q->where('status', $r->query('status'));
        if ($s = $r->query('q')) $q->where(fn ($w) => $w->where('nomor', 'ilike', "%$s%")->orWhereHas('patient', fn ($p) => $p->where('nama', 'ilike', "%$s%")->orWhere('no_rm', 'ilike', "%$s%")));
        if ($r->filled('from')) $q->where('created_at', '>=', $r->query('from').' 00:00:00');
        if ($r->filled('to')) $q->where('created_at', '<=', $r->query('to').' 23:59:59');
        return $q->paginate(15)->through(fn ($i) => $this->row($i));
    }

    public function show(Invoice $invoice) { return $this->detail($invoice); }

    public function update(Request $r, Invoice $invoice)
    {
        $this->editable($invoice);
        $d = $r->validate(['diskon' => 'required|numeric|min:0']);
        abort_if($d['diskon'] > (float) $invoice->subtotal, 422, 'Diskon tidak boleh melebihi subtotal.');
        $invoice->update(['diskon' => $d['diskon']]);
        $invoice->recalc(); $invoice->refreshStatus();
        AuditService::log('invoice.diskon', 'invoice:'.$invoice->id, ['diskon' => $d['diskon']]);
        return $this->detail($invoice);
    }

    public function addItem(Request $r, Invoice $invoice)
    {
        $this->editable($invoice);
        $d = $r->validate(['deskripsi' => 'required|string|max:200', 'qty' => 'required|integer|between:1,1000', 'harga' => 'required|numeric|min:0|max:100000000']);
        InvoiceItem::create($d + ['invoice_id' => $invoice->id]);
        $invoice->recalc(); $invoice->refreshStatus();
        AuditService::log('invoice.item_tambah', 'invoice:'.$invoice->id, $d);
        return $this->detail($invoice);
    }

    public function removeItem(Invoice $invoice, InvoiceItem $item)
    {
        $this->editable($invoice);
        abort_unless($item->invoice_id === $invoice->id, 404, 'Item tidak ditemukan.');
        $item->delete();
        $invoice->recalc(); $invoice->refreshStatus();
        AuditService::log('invoice.item_hapus', 'invoice:'.$invoice->id, ['item' => $item->deskripsi]);
        return $this->detail($invoice);
    }

    /** Kasir mencatat pembayaran langsung (otomatis terverifikasi). */
    public function pay(Request $r, Invoice $invoice)
    {
        $d = $r->validate(['jumlah' => 'required|numeric|min:1', 'metode' => 'required|in:tunai,transfer,qris,debit', 'bukti' => 'nullable|string|max:100']);
        DB::transaction(function () use ($invoice, $d, $r) {
            $inv = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            abort_if($inv->status === 'lunas', 422, 'Tagihan ini sudah lunas.');
            $sisa = (float) $inv->total - $inv->dibayar();
            abort_if($d['jumlah'] > $sisa + 0.001, 422, 'Jumlah melebihi sisa tagihan ('.number_format($sisa, 0, ',', '.').').');
            $inv->payments()->create($d + ['status' => 'terverifikasi', 'verified_by' => $r->user()->id]);
            $inv->refreshStatus();
        });
        AuditService::log('pembayaran.catat', 'invoice:'.$invoice->id, ['jumlah' => $d['jumlah'], 'metode' => $d['metode']]);
        $invoice->refresh();
        if ($invoice->status === 'lunas') $this->notify($invoice, 'Pembayaran lunas', "Tagihan {$invoice->nomor} telah lunas. Terima kasih.");
        return $this->detail($invoice);
    }

    public function verify(Request $r, Payment $payment)
    {
        $d = $r->validate(['aksi' => 'required|in:terima,tolak']);
        $invoice = DB::transaction(function () use ($payment, $d, $r) {
            $p = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            abort_unless($p->status === 'menunggu_verifikasi', 422, 'Pembayaran ini sudah diverifikasi.');
            $inv = Invoice::whereKey($p->invoice_id)->lockForUpdate()->firstOrFail();
            if ($d['aksi'] === 'terima') {
                abort_if((float) $p->jumlah > (float) $inv->total - $inv->dibayar() + 0.001, 422, 'Jumlah pembayaran melebihi sisa tagihan.');
                $p->update(['status' => 'terverifikasi', 'verified_by' => $r->user()->id]);
            } else {
                $p->update(['status' => 'ditolak', 'verified_by' => $r->user()->id]);
            }
            $inv->refreshStatus();
            return $inv;
        });
        AuditService::log('pembayaran.verifikasi', 'payment:'.$payment->id, ['aksi' => $d['aksi']]);
        $this->notify($invoice, $d['aksi'] === 'terima' ? 'Pembayaran diterima' : 'Pembayaran ditolak',
            $d['aksi'] === 'terima' ? "Pembayaran untuk {$invoice->nomor} telah diverifikasi." : "Pembayaran untuk {$invoice->nomor} ditolak. Hubungi kasir atau ulangi pembayaran.");
        return $this->detail($invoice);
    }

    public function transactions(Request $r)
    {
        $r->validate(['from' => 'nullable|date', 'to' => 'nullable|date']);
        $q = Payment::with('invoice:id,nomor,patient_id', 'invoice.patient:id,nama,no_rm', 'verifier:id,name')->latest('id');
        if ($r->filled('status')) $q->where('status', $r->query('status'));
        if ($r->filled('metode')) $q->where('metode', $r->query('metode'));
        if ($r->filled('from')) $q->where('created_at', '>=', $r->query('from').' 00:00:00');
        if ($r->filled('to')) $q->where('created_at', '<=', $r->query('to').' 23:59:59');
        $total = (clone $q)->where('status', 'terverifikasi')->sum('jumlah');
        $page = $q->paginate(20)->through(fn ($p) => ['id' => $p->id, 'waktu' => $p->created_at->toIso8601String(), 'invoice' => $p->invoice?->nomor, 'pasien' => $p->invoice?->patient?->nama,
            'metode' => $p->metode, 'jumlah' => (float) $p->jumlah, 'status' => $p->status, 'bukti' => $p->bukti, 'verifikator' => $p->verifier?->name]);
        return array_merge($page->toArray(), ['total_terverifikasi' => (float) $total]);
    }
}
