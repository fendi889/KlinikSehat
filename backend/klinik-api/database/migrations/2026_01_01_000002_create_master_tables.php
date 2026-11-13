<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('clinics', function (Blueprint $t) {
            $t->id(); $t->string('nama'); $t->text('alamat')->nullable(); $t->string('telp')->nullable();
            $t->string('email')->nullable(); $t->string('jam_buka')->nullable(); $t->timestamps();
        });
        Schema::create('polis', function (Blueprint $t) {
            $t->id(); $t->foreignId('clinic_id')->constrained()->cascadeOnDelete();
            $t->string('nama'); $t->string('kode', 3); $t->text('deskripsi')->nullable();
            $t->boolean('aktif')->default(true); $t->timestamps();
        });
        Schema::create('doctors', function (Blueprint $t) {
            $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('poli_id')->constrained('polis');
            $t->string('no_str')->nullable(); $t->string('spesialis')->nullable();
            $t->unsignedSmallInteger('pengalaman_tahun')->default(0);
            $t->text('bio')->nullable(); $t->string('foto')->nullable(); $t->timestamps();
        });
        Schema::create('staff', function (Blueprint $t) {
            $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('nip')->nullable(); $t->string('jabatan')->nullable(); $t->timestamps();
        });
        Schema::create('patients', function (Blueprint $t) {
            $t->id(); $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('no_rm')->unique(); $t->string('nama'); $t->string('nik', 16)->nullable()->unique();
            $t->date('tgl_lahir')->nullable(); $t->string('jenis_kelamin', 1)->nullable();
            $t->string('golongan_darah', 3)->nullable(); $t->text('alamat')->nullable();
            $t->text('alergi')->nullable(); $t->string('kontak_darurat')->nullable(); $t->timestamps();
        });
        Schema::create('schedules', function (Blueprint $t) {
            $t->id(); $t->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $t->unsignedTinyInteger('hari'); // 1=Senin ... 7=Minggu
            $t->time('jam_mulai'); $t->time('jam_selesai'); $t->unsignedSmallInteger('kuota')->default(20);
            $t->boolean('aktif')->default(true); $t->timestamps();
        });
        Schema::create('services', function (Blueprint $t) {
            $t->id(); $t->foreignId('poli_id')->nullable()->constrained('polis')->nullOnDelete();
            $t->string('nama'); $t->text('deskripsi')->nullable(); $t->decimal('tarif', 12, 2)->default(0);
            $t->boolean('aktif')->default(true); $t->timestamps();
        });
        Schema::create('articles', function (Blueprint $t) {
            $t->id(); $t->string('slug')->unique(); $t->string('judul'); $t->text('ringkas')->nullable();
            $t->longText('isi')->nullable(); $t->timestamp('terbit_at')->nullable(); $t->timestamps();
        });
        Schema::create('faqs', function (Blueprint $t) {
            $t->id(); $t->string('pertanyaan'); $t->text('jawaban'); $t->unsignedSmallInteger('urutan')->default(0); $t->timestamps();
        });
        Schema::create('settings', function (Blueprint $t) {
            $t->string('key')->primary(); $t->text('value')->nullable(); $t->timestamps();
        });
    }
    public function down(): void
    {
        foreach (['settings','faqs','articles','services','schedules','patients','staff','doctors','polis','clinics'] as $x) Schema::dropIfExists($x);
    }
};
