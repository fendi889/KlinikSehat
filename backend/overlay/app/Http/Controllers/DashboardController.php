<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /** Ringkasan kartu statistik sesuai role. Modul lengkap dibangun pada bab dashboard masing-masing. */
    public function summary(Request $r)
    {
        $u = $r->user()->load('role');
        $today = now()->toDateString();
        $c = fn (string $t, array $w = []) => DB::table($t)->where($w)->count();

        $cards = match ($u->role->slug) {
            'super_admin' => [['Total akun', $c('users')], ['Akun aktif', $c('users', ['is_active' => true])], ['Role', $c('roles')], ['Klinik', $c('clinics')]],
            'admin_klinik' => [['Pasien', $c('patients')], ['Dokter', $c('doctors')], ['Kunjungan hari ini', $c('visits', ['tanggal' => $today])], ['Invoice belum bayar', $c('invoices', ['status' => 'belum_bayar'])]],
            'pemilik' => [['Kunjungan hari ini', $c('visits', ['tanggal' => $today])], ['Total pasien', $c('patients')], ['Pendapatan terverifikasi (Rp)', (float) DB::table('payments')->where('status', 'terverifikasi')->sum('jumlah')], ['Poli aktif', $c('polis', ['aktif' => true])]],
            'dokter' => [['Pasien menunggu', DB::table('queues')->join('visits', 'visits.id', '=', 'queues.visit_id')->where('visits.doctor_id', $r->user()->doctor?->id)->where('queues.tanggal', $today)->where('queues.status', 'menunggu')->count()], ['Kunjungan hari ini', $c('visits', ['tanggal' => $today, 'doctor_id' => $r->user()->doctor?->id])]],
            'perawat' => [['Antrian menunggu', $c('queues', ['tanggal' => $today, 'status' => 'menunggu'])], ['Sedang dilayani', $c('queues', ['tanggal' => $today, 'status' => 'dilayani'])], ['Kunjungan hari ini', $c('visits', ['tanggal' => $today])]],
            'apoteker' => [['Resep baru', $c('prescriptions', ['status' => 'baru'])], ['Siap diserahkan', $c('prescriptions', ['status' => 'siap'])], ['Stok di bawah minimum', DB::table('medicines')->whereRaw('coalesce((select sum(stok) from medicine_batches b where b.medicine_id = medicines.id and b.tgl_kedaluwarsa >= current_date), 0) < medicines.stok_minimum')->count()], ['Batch segera kedaluwarsa (30 hari)', DB::table('medicine_batches')->where('stok', '>', 0)->whereBetween('tgl_kedaluwarsa', [now()->toDateString(), now()->addDays(30)->toDateString()])->count()]],
            'pasien' => [['Kunjungan saya', DB::table('visits')->join('patients', 'patients.id', '=', 'visits.patient_id')->where('patients.user_id', $u->id)->count()], ['Notifikasi baru', DB::table('notifications')->where('user_id', $u->id)->whereNull('dibaca_at')->count()]],
        };

        return ['role' => $u->role->slug, 'cards' => array_map(fn ($x) => ['label' => $x[0], 'value' => $x[1]], $cards)];
    }
}
