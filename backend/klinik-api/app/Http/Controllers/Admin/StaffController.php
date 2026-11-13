<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Staff;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/** Perawat dan apoteker. Admin tidak dapat membuat akun dengan role lain. */
class StaffController extends Controller
{
    private const ROLES = ['perawat', 'apoteker'];

    private function flat(User $u): array
    {
        return ['id' => $u->id, 'name' => $u->name, 'email' => $u->email, 'phone' => $u->phone, 'is_active' => $u->is_active,
            'role' => $u->role?->slug, 'role_nama' => $u->role?->nama, 'nip' => $u->staff?->nip];
    }

    private function scoped(User $user): User
    {
        abort_unless(in_array($user->role?->slug, self::ROLES, true), 403, 'Akun ini bukan perawat/apoteker.');
        return $user;
    }

    public function index()
    {
        return User::with('role:id,slug,nama', 'staff:id,user_id,nip')->whereHas('role', fn ($q) => $q->whereIn('slug', self::ROLES))
            ->orderBy('id')->get()->map(fn ($u) => $this->flat($u));
    }

    public function store(Request $r)
    {
        $v = $r->validate([
            'name' => 'required|string|max:100', 'email' => 'required|email|unique:users,email', 'phone' => 'nullable|string|max:20',
            'role' => ['required', Rule::in(self::ROLES)], 'nip' => 'nullable|string|max:30', 'password' => ['required', Password::min(8)], 'is_active' => 'required|boolean',
        ]);
        $role = Role::where('slug', $v['role'])->firstOrFail();
        $u = DB::transaction(function () use ($v, $role) {
            $u = User::create(['name' => $v['name'], 'email' => $v['email'], 'phone' => $v['phone'] ?? null, 'password' => $v['password'], 'role_id' => $role->id, 'is_active' => $v['is_active']]);
            Staff::create(['user_id' => $u->id, 'nip' => $v['nip'] ?? null, 'jabatan' => $role->nama]);
            return $u;
        });
        AuditService::log('staf.buat', 'user:'.$u->id, ['role' => $v['role']]);
        return response()->json($this->flat($u->load('role:id,slug,nama', 'staff:id,user_id,nip')), 201);
    }

    public function update(Request $r, User $user)
    {
        $this->scoped($user);
        $v = $r->validate([
            'name' => 'required|string|max:100', 'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => 'nullable|string|max:20', 'nip' => 'nullable|string|max:30', 'is_active' => 'required|boolean', 'password' => ['nullable', Password::min(8)],
        ]);
        $u = collect($v)->only(['name', 'email', 'phone', 'is_active'])->all();
        if (!empty($v['password'])) $u['password'] = $v['password'];
        $user->update($u);
        Staff::updateOrCreate(['user_id' => $user->id], ['nip' => $v['nip'] ?? null]);
        if (!$user->is_active || !empty($v['password'])) $user->tokens()->delete();
        AuditService::log('staf.ubah', 'user:'.$user->id);
        return $this->flat($user->fresh(['role:id,slug,nama', 'staff:id,user_id,nip']));
    }

    public function destroy(User $user)
    {
        $this->scoped($user);
        try { $user->tokens()->delete(); $user->delete(); } catch (QueryException) { abort(409, 'Akun memiliki data terkait. Nonaktifkan saja.'); }
        AuditService::log('staf.hapus', 'user:'.$user->id);
        return ['message' => 'Akun dihapus.'];
    }
}
