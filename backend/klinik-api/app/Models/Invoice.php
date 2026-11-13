<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $table = 'invoices';
    protected $guarded = [];

    public function items() { return $this->hasMany(InvoiceItem::class); }
    public function payments() { return $this->hasMany(Payment::class); }
    public function visit() { return $this->belongsTo(Visit::class); }

    public function patient() { return $this->belongsTo(Patient::class); }

    public function dibayar(): float { return (float) $this->payments()->where('status', 'terverifikasi')->sum('jumlah'); }

    /** Hitung ulang subtotal/total dari item dan diskon. */
    public function recalc(): void
    {
        $sub = (float) $this->items()->sum(\Illuminate\Support\Facades\DB::raw('qty * harga'));
        $this->update(['subtotal' => $sub, 'total' => max(0, $sub - (float) $this->diskon)]);
    }

    /** Lunas bila total nol atau pembayaran terverifikasi mencukupi. */
    public function refreshStatus(): void
    {
        $this->refresh();
        $this->update(['status' => ((float) $this->total <= 0 || $this->dibayar() >= (float) $this->total) ? 'lunas' : 'belum_bayar']);
    }
}
