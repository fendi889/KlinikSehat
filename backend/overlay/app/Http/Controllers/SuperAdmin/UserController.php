<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Role;
use App\Models\Staff;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $r)
    {
        $q = User::with('role:id,slug,nama')->orderBy('id');
        if ($s = $r->query('q')) {
            $q->where(fn ($w) => $w->where('name', 'ilike', "%$s%")->orWhere('email', 'ilike', "%$s%"));
        }
        if ($r->filled('role_id')) $q->where('role_id', $r->query('role_id'));
        return $q->paginate(15);
    }

    public function store(Request $r)
    {
        $d = $r->validate([
            'name' => 'required|string|max:100', 'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20', 'role_id' => 'required|exists:roles,id',
            'password' => ['required', Password::min(8)], 'poli_id' => 'nullable|exists:polis,id',
        ]);
        $role = Role::findOrFail($d['role_id']);
        abort_if($role->slug === 'dokter' && empty($d['poli_id']), 422, 'Poli wajib dipilih untuk akun dokter.');

        $user = DB::transaction(function () use ($d, $role) {
            $u = User::create(Arr::only($d, ['name', 'email', 'phone', 'password', 'role_id']));
            match (true) {
                $role->slug === 'pasien' => Patient::create(['user_id' => $u->id, 'no_rm' => Patient::nextRm(), 'nama' => $u->name]),
                $role->slug === 'dokter' => Doctor::create(['user_id' => $u->id, 'poli_id' => $d['poli_id']]),
                in_array($role->slug, ['admin_klinik', 'perawat', 'apoteker'], true) => Staff::create(['user_id' => $u->id, 'jabatan' => $role->nama]),
                default => null,
            };
            return $u;
        });
        AuditService::log('akun.buat', 'user:'.$user->id, ['email' => $user->email, 'role' => $role->slug]);
        return response()->json($user->load('role:id,slug,nama'), 201);
    }

    public function update(Request $r, User $user)
    {
        $d = $r->validate([
            'name' => 'required|string|max:100', 'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => 'nullable|string|max:20', 'is_active' => 'required|boolean', 'password' => ['nullable', Password::min(8)],
        ]);
        abort_if($user->id === $r->user()->id && !$d['is_active'], 422, 'Anda tidak dapat menonaktifkan akun sendiri.');
        if (empty($d['password'])) unset($d['password']);
        $user->update($d);
        if (!$user->is_active || isset($d['password'])) $user->tokens()->delete(); // paksa login ulang
        AuditService::log('akun.ubah', 'user:'.$user->id, ['aktif' => $user->is_active, 'ganti_password' => isset($d['password'])]);
        return $user->load('role:id,slug,nama');
    }

    public function destroy(Request $r, User $user)
    {
        abort_if($user->id === $r->user()->id, 422, 'Anda tidak dapat menghapus akun sendiri.');
        try {
            $user->tokens()->delete();
            $user->delete();
        } catch (QueryException) {
            abort(409, 'Akun memiliki data terkait. Nonaktifkan saja akun ini.');
        }
        AuditService::log('akun.hapus', 'user:'.$user->id, ['email' => $user->email]);
        return ['message' => 'Akun dihapus.'];
    }
}
