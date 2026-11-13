<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    private function msg(): array
    {
        return [
            'required' => ':attribute wajib diisi.', 'email' => 'Format email tidak valid.',
            'unique' => ':attribute sudah terdaftar.', 'min' => ':attribute minimal :min karakter.',
            'confirmed' => 'Konfirmasi password tidak cocok.', 'digits' => ':attribute harus :digits digit.',
        ];
    }

    public function login(Request $r)
    {
        $d = $r->validate(['email' => 'required|email', 'password' => 'required'], $this->msg());
        $user = User::with('role')->where('email', $d['email'])->first();

        if (!$user || !Hash::check($d['password'], $user->password)) {
            return response()->json(['message' => 'Email atau password salah.'], 422);
        }
        if (!$user->is_active) {
            return response()->json(['message' => 'Akun Anda dinonaktifkan. Hubungi admin klinik.'], 403);
        }
        AuditService::log('login', 'user:'.$user->id, [], $user->id);
        return ['token' => $user->createToken('web', ['*'], now()->addHours(12))->plainTextToken, 'user' => $user->toApi()];
    }

    public function register(Request $r)
    {
        $d = $r->validate([
            'name' => 'required|string|max:100', 'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20', 'nik' => 'nullable|digits:16|unique:patients,nik',
            'tgl_lahir' => 'required|date|before:today', 'jenis_kelamin' => 'required|in:L,P',
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ], $this->msg());

        $user = DB::transaction(function () use ($d) {
            $user = User::create([
                'name' => $d['name'], 'email' => $d['email'], 'phone' => $d['phone'],
                'password' => $d['password'], 'role_id' => Role::where('slug', 'pasien')->value('id'),
            ]);
            Patient::create([
                'user_id' => $user->id, 'no_rm' => Patient::nextRm(), 'nama' => $d['name'], 'nik' => $d['nik'] ?? null,
                'tgl_lahir' => $d['tgl_lahir'], 'jenis_kelamin' => $d['jenis_kelamin'],
            ]);
            return $user->load('role');
        });
        return response()->json(['token' => $user->createToken('web', ['*'], now()->addHours(12))->plainTextToken, 'user' => $user->toApi()], 201);
    }

    public function me(Request $r) { return ['user' => $r->user()->load('role')->toApi()]; }

    public function logout(Request $r)
    {
        AuditService::log('logout', 'user:'.$r->user()->id);
        $r->user()->currentAccessToken()->delete();
        return ['message' => 'Berhasil keluar.'];
    }

    public function updateProfile(Request $r)
    {
        $d = $r->validate(['name' => 'required|string|max:100', 'phone' => 'nullable|string|max:20'], $this->msg());
        $r->user()->update($d);
        return ['message' => 'Profil diperbarui.', 'user' => $r->user()->load('role')->toApi()];
    }

    public function changePassword(Request $r)
    {
        $d = $r->validate([
            'current_password' => 'required', 'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ], $this->msg());
        if (!Hash::check($d['current_password'], $r->user()->password)) {
            return response()->json(['message' => 'Password saat ini salah.', 'errors' => ['current_password' => ['Password saat ini salah.']]], 422);
        }
        $r->user()->update(['password' => $d['password']]);
        return ['message' => 'Password berhasil diubah.'];
    }

    public function forgotPassword(Request $r)
    {
        $r->validate(['email' => 'required|email'], $this->msg());
        Password::sendResetLink($r->only('email')); // respons sama agar email tidak bisa ditebak
        return ['message' => 'Jika email terdaftar, tautan reset password telah dikirim.'];
    }

    public function resetPassword(Request $r)
    {
        $r->validate([
            'token' => 'required', 'email' => 'required|email', 'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ], $this->msg());
        $status = Password::reset($r->only('email', 'password', 'password_confirmation', 'token'), function (User $u, string $pw) {
            $u->forceFill(['password' => $pw, 'remember_token' => Str::random(60)])->save();
            $u->tokens()->delete();
        });
        return $status === Password::PASSWORD_RESET
            ? ['message' => 'Password berhasil direset. Silakan masuk.']
            : response()->json(['message' => 'Token reset tidak valid atau kedaluwarsa.'], 422);
    }
}
