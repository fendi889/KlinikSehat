<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $t) {
            $t->id(); $t->string('nama'); $t->foreignId('poli_id')->nullable()->constrained('polis')->nullOnDelete();
            $t->boolean('aktif')->default(true); $t->timestamps();
        });
        Schema::table('visits', fn (Blueprint $t) => $t->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete());
        Schema::create('procedure_schedules', function (Blueprint $t) {
            $t->id(); $t->foreignId('patient_id')->constrained(); $t->foreignId('visit_id')->nullable()->constrained()->nullOnDelete();
            $t->string('nama'); $t->timestamp('jadwal_at'); $t->string('status')->default('terjadwal'); // terjadwal, selesai, batal
            $t->text('catatan')->nullable(); $t->foreignId('nurse_id')->nullable()->constrained('users')->nullOnDelete(); $t->timestamps();
            $t->index(['status', 'jadwal_at']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('procedure_schedules');
        Schema::table('visits', fn (Blueprint $t) => $t->dropConstrainedForeignId('room_id'));
        Schema::dropIfExists('rooms');
    }
};
