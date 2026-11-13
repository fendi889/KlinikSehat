<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Pengingat jadwal besok dan peringatan stok obat. Jalankan scheduler: php artisan schedule:work
Schedule::command('kliniksehat:notifikasi-harian')->dailyAt('18:00');
