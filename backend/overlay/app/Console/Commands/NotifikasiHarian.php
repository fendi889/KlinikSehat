<?php

namespace App\Console\Commands;

use App\Models\AppNotification;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class NotifikasiHarian extends Command
{
    protected $signature = 'kliniksehat:notifikasi-harian';
    protected $description = 'Kirim pengingat jadwal kunjungan besok dan peringatan stok/kedaluwarsa obat (aman dijalankan berulang, tanpa duplikat hari yang sama).';

    private function kirim(int $uid, string $tipe, string $judul, string $pesan): int
    {
        $ada = AppNotification::where('user_id', $uid)->where('tipe', $tipe)->where('pesan', $pesan)->whereDate('created_at', today())->exists();
        if ($ada) return 0;
        AppNotification::create(['user_id' => $uid, 'tipe' => $tipe, 'judul' => $judul, 'pesan' => $pesan]);
        return 1;
    }

    public function handle(): int
    {
        $n = 0;

        Visit::where('tanggal', today()->addDay()->toDateString())->whereIn('status', ['terdaftar', 'diverifikasi'])
            ->with('patient:id,user_id', 'poli:id,nama', 'doctor.user:id,name', 'queue:id,visit_id,kode')->get()->each(function ($v) use (&$n) {
                if (!$v->patient?->user_id) return;
                $n += $this->kirim($v->patient->user_id, 'pengingat', 'Pengingat jadwal kunjungan',
                    'Besok ('.$v->tanggal->format('d/m/Y').") Anda dijadwalkan di {$v->poli->nama} dengan {$v->doctor->user->name}. Nomor antrian {$v->queue?->kode}.");
            });

        $rendah = DB::table('medicines')->whereRaw('(select coalesce(sum(b.stok), 0) from medicine_batches b where b.medicine_id = medicines.id and b.tgl_kedaluwarsa >= current_date) < medicines.stok_minimum')
            ->selectRaw('medicines.nama, medicines.stok_minimum, (select coalesce(sum(b.stok), 0) from medicine_batches b where b.medicine_id = medicines.id and b.tgl_kedaluwarsa >= current_date) as stok')->get();
        $segera = DB::table('medicine_batches')->join('medicines', 'medicines.id', '=', 'medicine_batches.medicine_id')->where('medicine_batches.stok', '>', 0)
            ->where('medicine_batches.tgl_kedaluwarsa', '<=', today()->addDays(30)->toDateString())->get(['medicines.nama', 'medicine_batches.no_batch', 'medicine_batches.tgl_kedaluwarsa', 'medicine_batches.stok']);

        $penerima = User::where('is_active', true)->whereHas('role', fn ($q) => $q->whereIn('slug', ['apoteker', 'admin_klinik']))->pluck('id');
        foreach ($penerima as $uid) {
            foreach ($rendah as $o) $n += $this->kirim($uid, 'stok', 'Stok obat menipis', "Stok {$o->nama} tinggal {$o->stok} (minimum {$o->stok_minimum}).");
            foreach ($segera as $b) {
                $habis = $b->tgl_kedaluwarsa < today()->toDateString();
                $n += $this->kirim($uid, 'stok', $habis ? 'Batch obat kedaluwarsa' : 'Obat segera kedaluwarsa', "{$b->nama} batch {$b->no_batch} ".($habis ? 'sudah kedaluwarsa' : 'kedaluwarsa pada '.$b->tgl_kedaluwarsa)." (stok {$b->stok}).");
            }
        }
        $this->info("Notifikasi terkirim: $n");
        return self::SUCCESS;
    }
}
