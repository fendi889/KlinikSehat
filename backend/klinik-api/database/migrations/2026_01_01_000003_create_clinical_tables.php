<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $t) {
            $t->id(); $t->foreignId('patient_id')->constrained(); $t->foreignId('doctor_id')->constrained();
            $t->foreignId('poli_id')->constrained('polis'); $t->foreignId('schedule_id')->nullable()->constrained()->nullOnDelete();
            $t->date('tanggal'); $t->text('keluhan')->nullable();
            $t->string('status')->default('terdaftar'); // terdaftar, diverifikasi, menunggu_dokter, diperiksa, selesai, batal
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete(); $t->timestamps();
            $t->index(['tanggal', 'status']);
        });
        Schema::create('queues', function (Blueprint $t) {
            $t->id(); $t->foreignId('visit_id')->unique()->constrained()->cascadeOnDelete();
            $t->foreignId('poli_id')->constrained('polis'); $t->date('tanggal');
            $t->unsignedInteger('nomor'); $t->string('kode', 10);
            $t->string('status')->default('menunggu'); // menunggu, dipanggil, dilayani, selesai, batal, terlewat
            $t->timestamp('called_at')->nullable(); $t->timestamps();
            $t->unique(['poli_id', 'tanggal', 'nomor']); // cegah nomor ganda
        });
        Schema::create('vital_signs', function (Blueprint $t) {
            $t->id(); $t->foreignId('visit_id')->unique()->constrained()->cascadeOnDelete();
            $t->unsignedSmallInteger('td_sistol')->nullable(); $t->unsignedSmallInteger('td_diastol')->nullable();
            $t->unsignedSmallInteger('nadi')->nullable(); $t->decimal('suhu', 4, 1)->nullable();
            $t->unsignedSmallInteger('napas')->nullable(); $t->unsignedSmallInteger('spo2')->nullable();
            $t->decimal('bb', 5, 1)->nullable(); $t->decimal('tb', 5, 1)->nullable();
            $t->foreignId('nurse_id')->nullable()->constrained('users')->nullOnDelete(); $t->timestamps();
        });
        Schema::create('medical_records', function (Blueprint $t) {
            $t->id(); $t->foreignId('visit_id')->unique()->constrained()->cascadeOnDelete();
            $t->foreignId('patient_id')->constrained(); $t->foreignId('doctor_id')->constrained();
            $t->text('keluhan_utama')->nullable(); $t->text('riwayat_penyakit')->nullable();
            $t->text('pemeriksaan_fisik')->nullable(); $t->text('catatan_dokter')->nullable(); $t->timestamps();
        });
        Schema::create('diagnoses', function (Blueprint $t) {
            $t->id(); $t->foreignId('medical_record_id')->constrained()->cascadeOnDelete();
            $t->string('kode_icd', 10)->nullable(); $t->string('nama'); $t->timestamps();
        });
        Schema::create('procedures', function (Blueprint $t) {
            $t->id(); $t->foreignId('medical_record_id')->constrained()->cascadeOnDelete();
            $t->string('nama'); $t->decimal('biaya', 12, 2)->default(0); $t->timestamps();
        });
        Schema::create('medical_documents', function (Blueprint $t) {
            $t->id(); $t->foreignId('medical_record_id')->constrained()->cascadeOnDelete();
            $t->string('jenis'); $t->string('judul'); $t->string('path')->nullable(); $t->timestamps();
        });
        Schema::create('record_revisions', function (Blueprint $t) {
            $t->id(); $t->foreignId('medical_record_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); $t->json('perubahan'); $t->timestamps();
        });
    }
    public function down(): void
    {
        foreach (['record_revisions','medical_documents','procedures','diagnoses','medical_records','vital_signs','queues','visits'] as $x) Schema::dropIfExists($x);
    }
};
