<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Doctor;
use App\Models\Faq;
use App\Models\Patient;
use App\Models\Poli;
use App\Models\Review;
use App\Models\Service;

class PublicController extends Controller
{
    public function stats()
    {
        return [
            ['label' => 'Pasien terlayani', 'nilai' => Patient::count()],
            ['label' => 'Dokter praktik', 'nilai' => Doctor::count()],
            ['label' => 'Poli tersedia', 'nilai' => Poli::where('aktif', true)->count()],
            ['label' => 'Rating pasien', 'nilai' => round((float) Review::avg('rating'), 1) ?: null],
        ];
    }

    public function doctors()
    {
        return Doctor::with(['user:id,name', 'poli:id,nama', 'schedules' => fn ($q) => $q->where('aktif', true)->orderBy('hari')])->get();
    }

    public function services() { return Service::where('aktif', true)->with('poli:id,nama')->get(); }
    public function polis() { return Poli::where('aktif', true)->get(['id', 'nama', 'kode']); }
    public function articles() { return Article::whereNotNull('terbit_at')->latest('terbit_at')->get(['slug', 'judul', 'ringkas', 'terbit_at']); }
    public function article(string $slug) { return Article::where('slug', $slug)->whereNotNull('terbit_at')->firstOrFail(); }
    public function faqs() { return Faq::orderBy('urutan')->get(); }
    public function testimonials()
    {
        return Review::where('tampil', true)->with('patient:id,nama')->latest()->take(6)->get(['id', 'patient_id', 'rating', 'ulasan']);
    }

    /** Papan antrian publik: hanya kode nomor, tanpa nama pasien. */
    public function queueBoard()
    {
        $today = today()->toDateString();
        return Poli::where('aktif', true)->orderBy('id')->get(['id', 'nama', 'kode'])->map(function ($p) use ($today) {
            $q = \App\Models\Queue::where('poli_id', $p->id)->where('tanggal', $today);
            return [
                'poli' => $p->nama,
                'sekarang' => (clone $q)->whereIn('status', ['dipanggil', 'dilayani'])->orderByDesc('called_at')->value('kode'),
                'berikutnya' => (clone $q)->where('status', 'menunggu')->orderBy('nomor')->take(5)->pluck('kode'),
                'menunggu' => (clone $q)->where('status', 'menunggu')->count(),
            ];
        });
    }
}
