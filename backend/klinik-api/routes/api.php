<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\SuperAdmin as SA;
use App\Http\Controllers\Admin as AD;
use App\Http\Controllers\Pemilik as PM;
use App\Http\Controllers\NotificationController as NF;
use App\Http\Controllers\ReportController as RP;
use App\Http\Controllers\Apoteker as AP;
use App\Http\Controllers\Perawat\PerawatController as PW;
use App\Http\Controllers\Pasien\PasienController as PSX;
use App\Http\Controllers\Dokter\DokterController as DK;
use App\Http\Controllers\Pasien\PasienController as PS;
use Illuminate\Support\Facades\Route;

Route::group([], function () {
    // Publik
    Route::prefix('public')->controller(PublicController::class)->group(function () {
        Route::get('stats', 'stats'); Route::get('doctors', 'doctors'); Route::get('services', 'services');
        Route::get('polis', 'polis'); Route::get('articles', 'articles'); Route::get('articles/{slug}', 'article');
        Route::get('faqs', 'faqs'); Route::get('testimonials', 'testimonials');
        Route::get('queue-board', 'queueBoard')->middleware('throttle:120,1');
    });

    // Autentikasi
    Route::prefix('auth')->controller(AuthController::class)->group(function () {
        Route::post('login', 'login')->middleware('throttle:10,1');
        Route::post('register', 'register')->middleware('throttle:10,1');
        Route::post('forgot-password', 'forgotPassword')->middleware('throttle:5,1');
        Route::post('reset-password', 'resetPassword')->middleware('throttle:5,1');
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me', 'me'); Route::post('logout', 'logout');
            Route::put('profile', 'updateProfile'); Route::put('password', 'changePassword');
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('dashboard/summary', [DashboardController::class, 'summary']);

        // Antrian
        Route::get('queues', [QueueController::class, 'index'])->middleware('role:admin_klinik,perawat,pasien,super_admin');
        Route::post('queues', [QueueController::class, 'store'])->middleware('role:admin_klinik,perawat');
        Route::post('queues/{queue}/call', [QueueController::class, 'call'])->middleware('role:perawat,admin_klinik');

        // Notifikasi (BAB 16) dan Laporan (BAB 17)
        Route::get('notifications', [NF::class, 'index']); Route::get('notifications/unread', [NF::class, 'unread']);
        Route::post('notifications/read-all', [NF::class, 'readAll']); Route::post('notifications/{id}/read', [NF::class, 'read']);
        Route::prefix('laporan')->middleware('role:admin_klinik,pemilik,super_admin')->group(function () {
            Route::get('/', [RP::class, 'index']); Route::get('{jenis}', [RP::class, 'show']);
        });

        // Super Admin (BAB 5)
        Route::prefix('super-admin')->middleware('role:super_admin')->group(function () {
            Route::apiResource('users', SA\UserController::class)->except('show');
            Route::get('roles', [SA\RoleController::class, 'index']);
            Route::get('permissions', [SA\RoleController::class, 'permissions']);
            Route::put('roles/{role}/permissions', [SA\RoleController::class, 'syncPermissions']);
            Route::get('clinic', [SA\ClinicController::class, 'show']);
            Route::put('clinic', [SA\ClinicController::class, 'update']);
            Route::get('settings', [SA\SettingController::class, 'index']);
            Route::put('settings', [SA\SettingController::class, 'update']);
            Route::get('audit-logs', [SA\AuditController::class, 'index']);
            Route::get('activity', [SA\AuditController::class, 'activity']);
        });

        // Admin Klinik (BAB 6)
        Route::prefix('admin')->middleware('role:admin_klinik')->group(function () {
            Route::apiResource('patients', AD\PatientController::class)->except('show');
            Route::apiResource('doctors', AD\DoctorController::class)->except('show');
            Route::apiResource('poli', AD\PoliController::class)->except('show')->parameters(['poli' => 'poli']);
            Route::apiResource('schedules', AD\ScheduleController::class)->except('show');
            Route::apiResource('rooms', AD\RoomController::class)->except('show');
            Route::apiResource('services', AD\ServiceController::class)->except('show');
            Route::get('staff', [AD\StaffController::class, 'index']);
            Route::post('staff', [AD\StaffController::class, 'store']);
            Route::put('staff/{user}', [AD\StaffController::class, 'update']);
            Route::delete('staff/{user}', [AD\StaffController::class, 'destroy']);
            Route::get('queue', [PW::class, 'queue']); Route::post('queue/{queue}/call', [PW::class, 'call']);
            Route::post('queue/{queue}/skip', [PW::class, 'skip']); Route::post('queue/{queue}/requeue', [PW::class, 'requeue']); Route::post('queue/{queue}/cancel', [PW::class, 'cancelQueue']);
            Route::get('invoices', [AD\InvoiceController::class, 'index']); Route::get('invoices/{invoice}', [AD\InvoiceController::class, 'show']);
            Route::put('invoices/{invoice}', [AD\InvoiceController::class, 'update']);
            Route::post('invoices/{invoice}/items', [AD\InvoiceController::class, 'addItem']); Route::delete('invoices/{invoice}/items/{item}', [AD\InvoiceController::class, 'removeItem']);
            Route::post('invoices/{invoice}/payments', [AD\InvoiceController::class, 'pay']); Route::post('payments/{payment}/verify', [AD\InvoiceController::class, 'verify']);
            Route::get('transactions', [AD\InvoiceController::class, 'transactions']);
            Route::get('clinic', [AD\ClinicController::class, 'show']);
            Route::put('clinic', [AD\ClinicController::class, 'update']);
        });

        // Pemilik Klinik (BAB 7)
        Route::prefix('pemilik')->middleware('role:pemilik')->group(function () {
            Route::get('overview', [PM\PemilikController::class, 'overview']);
            Route::get('finance', [PM\PemilikController::class, 'finance']);
            Route::get('performance', [PM\PemilikController::class, 'performance']);
            Route::get('charts', [PM\PemilikController::class, 'charts']);
            Route::get('monitoring', [PM\PemilikController::class, 'monitoring']);
            Route::apiResource('expenses', PM\ExpenseController::class)->except('show');
        });

        // Pasien (BAB 8)
        Route::prefix('pasien')->middleware('role:pasien')->controller(PS::class)->group(function () {
            Route::get('profile', 'profile'); Route::put('profile', 'updateProfile');
            Route::get('options', 'options'); Route::get('slots', 'slots');
            Route::get('active', 'active');
            Route::get('visits', 'visits'); Route::post('visits', 'register');
            Route::get('visits/{visit}', 'visitDetail'); Route::post('visits/{visit}/cancel', 'cancel');
            Route::get('prescriptions', 'prescriptions'); Route::get('invoices', 'invoices');
            Route::get('notifications', 'notifications'); Route::post('notifications/read-all', 'readAll'); Route::post('notifications/{id}/read', 'read');
            Route::get('reviews', 'reviews'); Route::post('reviews', 'storeReview'); Route::post('invoices/{invoice}/pay', 'payInvoice');
        });

        // Dokter (BAB 9)
        Route::prefix('dokter')->middleware('role:dokter')->controller(DK::class)->group(function () {
            Route::get('schedule', 'schedule');
            Route::get('queue', 'queue'); Route::post('queue/{queue}/call', 'call');
            Route::post('visits/{visit}/start', 'start'); Route::get('visits/{visit}', 'show'); Route::get('visits/{visit}/revisions', 'revisions');
            Route::put('visits/{visit}/exam', 'saveExam'); Route::put('visits/{visit}/prescription', 'prescribe');
            Route::post('visits/{visit}/finish', 'finish'); Route::post('visits/{visit}/documents', 'storeDocument');
            Route::get('history', 'history'); Route::get('prescriptions', 'prescriptions'); Route::get('medicines', 'medicines');
            Route::get('patients', 'patients'); Route::get('patients/{patient}/history', 'patientHistory');
            Route::get('documents', 'documents'); Route::delete('documents/{document}', 'destroyDocument');
        });

        // Perawat (BAB 10)
        Route::prefix('perawat')->middleware('role:perawat')->group(function () {
            Route::get('options', [PSX::class, 'options']); Route::get('slots', [PSX::class, 'slots']);
            Route::controller(PW::class)->group(function () {
                Route::get('patients', 'patients'); Route::post('patients', 'storePatient'); Route::post('visits', 'register');
                Route::get('queue', 'queue'); Route::post('queue/{queue}/call', 'call');
                Route::post('queue/{queue}/skip', 'skip'); Route::post('queue/{queue}/requeue', 'requeue'); Route::post('queue/{queue}/cancel', 'cancelQueue');
                Route::post('visits/{visit}/verify', 'verify');
                Route::get('visits/{visit}/vitals', 'showVitals'); Route::put('visits/{visit}/vitals', 'saveVitals');
                Route::get('rooms', 'rooms'); Route::put('visits/{visit}/room', 'assignRoom');
                Route::get('tasks', 'tasks'); Route::post('tasks', 'storeTask'); Route::put('tasks/{task}/status', 'taskStatus');
            });
        });

        // Apoteker (BAB 11 + sebagian BAB 14)
        Route::prefix('apoteker')->middleware('role:apoteker')->group(function () {
            Route::get('categories', [AP\ObatController::class, 'categories']); Route::post('categories', [AP\ObatController::class, 'storeCategory']);
            Route::put('categories/{id}', [AP\ObatController::class, 'updateCategory']); Route::delete('categories/{id}', [AP\ObatController::class, 'destroyCategory']);
            Route::get('medicine-options', [AP\ObatController::class, 'options']);
            Route::apiResource('medicines', AP\ObatController::class)->except('show');
            Route::get('batches', [AP\StokController::class, 'batches']); Route::post('stock-in', [AP\StokController::class, 'stockIn']);
            Route::post('stock-adjust', [AP\StokController::class, 'adjust']); Route::get('movements', [AP\StokController::class, 'movements']);
            Route::get('alerts', [AP\StokController::class, 'alerts']); Route::get('export/{jenis}', [AP\StokController::class, 'export']);
            Route::get('prescriptions', [AP\ResepController::class, 'index']);
            Route::post('prescriptions/{prescription}/process', [AP\ResepController::class, 'process']);
            Route::post('prescriptions/{prescription}/ready', [AP\ResepController::class, 'ready']);
            Route::post('prescriptions/{prescription}/dispense', [AP\ResepController::class, 'dispense']);
        });

        // Prefix per role: pembatasan akses API. Modul tiap role ditambahkan di bab dashboard masing-masing.
        foreach (['super-admin' => 'super_admin', 'admin' => 'admin_klinik', 'pemilik' => 'pemilik', 'dokter' => 'dokter',
                  'perawat' => 'perawat', 'apoteker' => 'apoteker', 'pasien' => 'pasien'] as $prefix => $role) {
            Route::prefix($prefix)->middleware("role:$role")->group(function () use ($prefix) {
                Route::get('ping', fn () => ['ok' => true, 'area' => $prefix]);
            });
        }
    });
});
