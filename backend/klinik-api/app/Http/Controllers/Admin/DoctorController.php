<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class DoctorController extends Controller
{
    private function flat(Doctor $d): array
    {
        return [
            'id' => $d->id, 'user_id' => $d->user_id, 'name' => $d->user->name, 'email' => $d->user->email, 'phone' => $d->user->phone,
            'is_active' => $d->user->is_active, 'poli_id' => $d->poli_id, 'poli_nama' => $d->poli?->nama, 'no_str' => $d->no_str,
            'spesialis' => $d->spesialis, 'pengalaman_tahun' => $d->pengalaman_tahun, 'bio' => $d->bio,
        ];
    }

    private function rules(?Doctor $d = null): array
    {
        return [
            'name' => 'required|string|max:100', 'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($d?->user_id)],
            'phone' => 'nullable|string|max:20', 'poli_id' => 'required|exists:polis,id', 'no_str' => 'nullable|string|max:50',
            'spesialis' => 'nullable|string|max:80', 'pengalaman_tahun' => 'required|integer|min:0|max:60', 'bio' => 'nullable|string',
            'password' => [$d ? 'nullable' : 'required', Password::min(8)],
        ];
    }

    public function index() { return Doctor::with('user', 'poli:id,nama')->orderBy('id')->get()->map(fn ($d) => $this->flat($d)); }

    public function store(Request $r)
    {
        $v = $r->validate($this->rules());
        $doc = DB::transaction(function () use ($v) {
            $u = User::create(['name' => $v['name'], 'email' => $v['email'], 'phone' => $v['phone'] ?? null,
                'password' => $v['password'], 'role_id' => Role::where('slug', 'dokter')->value('id')]);
            return Doctor::create(['user_id' => $u->id] + collect($v)->only(['poli_id', 'no_str', 'spesialis', 'pengalaman_tahun', 'bio'])->all());
        });
        AuditService::log('dokter.buat', 'doctor:'.$doc->id);
        return response()->json($this->flat($doc->load('user', 'poli:id,nama')), 201);
    }

    public function update(Request $r, Doctor $doctor)
    {
        $v = $r->validate($this->rules($doctor));
        DB::transaction(function () use ($v, $doctor) {
            $u = ['name' => $v['name'], 'email' => $v['email'], 'phone' => $v['phone'] ?? null];
            if (!empty($v['password'])) $u['password'] = $v['password'];
            $doctor->user->update($u);
            $doctor->update(collect($v)->only(['poli_id', 'no_str', 'spesialis', 'pengalaman_tahun', 'bio'])->all());
        });
        AuditService::log('dokter.ubah', 'doctor:'.$doctor->id);
        return $this->flat($doctor->fresh(['user', 'poli:id,nama']));
    }

    public function destroy(Doctor $doctor)
    {
        try {
            DB::transaction(function () use ($doctor) { $doctor->delete(); $doctor->user->tokens()->delete(); $doctor->user->delete(); });
        } catch (QueryException) {
            abort(409, 'Dokter memiliki kunjungan/rekam medis. Nonaktifkan akunnya lewat Super Admin.');
        }
        AuditService::log('dokter.hapus', 'doctor:'.$doctor->id);
        return ['message' => 'Dokter dihapus.'];
    }
}
