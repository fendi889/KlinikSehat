<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $t) {
            $t->id(); $t->string('slug')->unique(); $t->string('nama'); $t->timestamps();
        });
        Schema::create('permissions', function (Blueprint $t) {
            $t->id(); $t->string('slug')->unique(); $t->string('nama'); $t->string('modul'); $t->timestamps();
        });
        Schema::create('permission_role', function (Blueprint $t) {
            $t->foreignId('role_id')->constrained()->cascadeOnDelete();
            $t->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $t->primary(['role_id', 'permission_id']);
        });
        Schema::table('users', function (Blueprint $t) {
            $t->foreignId('role_id')->nullable()->constrained('roles');
            $t->string('phone', 20)->nullable();
            $t->boolean('is_active')->default(true);
        });
    }
    public function down(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->dropConstrainedForeignId('role_id'));
        Schema::dropIfExists('permission_role'); Schema::dropIfExists('permissions'); Schema::dropIfExists('roles');
    }
};
