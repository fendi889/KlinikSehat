<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const HOME = [
        'super_admin' => '/super-admin', 'admin_klinik' => '/admin', 'pemilik' => '/pemilik',
        'dokter' => '/dokter', 'perawat' => '/perawat', 'apoteker' => '/apoteker', 'pasien' => '/pasien',
    ];

    protected $fillable = ['name', 'email', 'password', 'phone', 'role_id', 'is_active'];
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['email_verified_at' => 'datetime', 'password' => 'hashed', 'is_active' => 'boolean'];
    }

    public function role() { return $this->belongsTo(Role::class); }
    public function patient() { return $this->hasOne(Patient::class); }
    public function doctor() { return $this->hasOne(Doctor::class); }
    public function staff() { return $this->hasOne(Staff::class); }

    public function toApi(): array
    {
        $slug = $this->role?->slug;
        return [
            'id' => $this->id, 'name' => $this->name, 'email' => $this->email, 'phone' => $this->phone,
            'role' => $slug, 'role_nama' => $this->role?->nama, 'dashboard' => self::HOME[$slug] ?? '/',
        ];
    }
}
