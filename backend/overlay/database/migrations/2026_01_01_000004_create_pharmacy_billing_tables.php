<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('medicine_categories', function (Blueprint $t) { $t->id(); $t->string('nama'); $t->timestamps(); });
        Schema::create('medicines', function (Blueprint $t) {
            $t->id(); $t->string('kode')->unique(); $t->string('nama');
            $t->foreignId('category_id')->nullable()->constrained('medicine_categories')->nullOnDelete();
            $t->string('satuan', 20); $t->decimal('harga_jual', 12, 2)->default(0); $t->unsignedInteger('stok_minimum')->default(10); $t->timestamps();
        });
        Schema::create('medicine_batches', function (Blueprint $t) {
            $t->id(); $t->foreignId('medicine_id')->constrained()->cascadeOnDelete(); $t->string('no_batch');
            $t->date('tgl_kedaluwarsa'); $t->unsignedInteger('stok')->default(0); $t->decimal('harga_beli', 12, 2)->default(0); $t->timestamps();
            $t->unique(['medicine_id', 'no_batch']);
        });
        Schema::create('stock_movements', function (Blueprint $t) {
            $t->id(); $t->foreignId('batch_id')->constrained('medicine_batches'); $t->string('jenis', 10); // masuk, keluar, koreksi
            $t->integer('jumlah'); $t->string('keterangan')->nullable(); $t->nullableMorphs('ref');
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); $t->timestamps();
        });
        Schema::create('prescriptions', function (Blueprint $t) {
            $t->id(); $t->foreignId('medical_record_id')->constrained()->cascadeOnDelete();
            $t->string('status')->default('baru'); // baru, diproses, siap, diserahkan
            $t->foreignId('pharmacist_id')->nullable()->constrained('users')->nullOnDelete(); $t->timestamps();
        });
        Schema::create('prescription_items', function (Blueprint $t) {
            $t->id(); $t->foreignId('prescription_id')->constrained()->cascadeOnDelete(); $t->foreignId('medicine_id')->constrained();
            $t->unsignedInteger('jumlah'); $t->string('aturan_pakai')->nullable(); $t->timestamps();
        });
        Schema::create('invoices', function (Blueprint $t) {
            $t->id(); $t->string('nomor')->unique(); $t->foreignId('visit_id')->constrained(); $t->foreignId('patient_id')->constrained();
            $t->decimal('subtotal', 12, 2)->default(0); $t->decimal('diskon', 12, 2)->default(0); $t->decimal('total', 12, 2)->default(0);
            $t->string('status')->default('belum_bayar'); $t->timestamps();
        });
        Schema::create('invoice_items', function (Blueprint $t) {
            $t->id(); $t->foreignId('invoice_id')->constrained()->cascadeOnDelete(); $t->string('deskripsi');
            $t->unsignedInteger('qty')->default(1); $t->decimal('harga', 12, 2); $t->timestamps();
        });
        Schema::create('payments', function (Blueprint $t) {
            $t->id(); $t->foreignId('invoice_id')->constrained(); $t->decimal('jumlah', 12, 2); $t->string('metode', 20);
            $t->string('status')->default('menunggu_verifikasi'); $t->string('bukti')->nullable();
            $t->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete(); $t->timestamps();
        });
        Schema::create('expenses', function (Blueprint $t) {
            $t->id(); $t->date('tanggal'); $t->string('kategori'); $t->string('keterangan')->nullable(); $t->decimal('jumlah', 12, 2); $t->timestamps();
        });
        Schema::create('notifications', function (Blueprint $t) {
            $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->string('tipe', 30);
            $t->string('judul'); $t->text('pesan')->nullable(); $t->timestamp('dibaca_at')->nullable(); $t->timestamps();
        });
        Schema::create('reviews', function (Blueprint $t) {
            $t->id(); $t->foreignId('patient_id')->constrained(); $t->foreignId('visit_id')->nullable()->constrained()->nullOnDelete();
            $t->unsignedTinyInteger('rating'); $t->text('ulasan')->nullable(); $t->boolean('tampil')->default(false); $t->timestamps();
        });
        Schema::create('audit_logs', function (Blueprint $t) {
            $t->id(); $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); $t->string('aksi');
            $t->string('target')->nullable(); $t->json('detail')->nullable(); $t->string('ip', 45)->nullable(); $t->timestamps();
        });
    }
    public function down(): void
    {
        foreach (['audit_logs','reviews','notifications','expenses','payments','invoice_items','invoices','prescription_items','prescriptions','stock_movements','medicine_batches','medicines','medicine_categories'] as $x) Schema::dropIfExists($x);
    }
};
