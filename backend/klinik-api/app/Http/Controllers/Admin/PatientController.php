<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Services\AuditService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PatientController extends Controller
{
    private function rules(?Patient $p = null): array
    {
        return [
            'nama' => 'required|string|max:100', 'nik' => ['nullable', 'digits:16', Rule::unique('patients', 'nik')->ignore($p?->id)],
            'tgl_lahir' => 'nullable|date|before:today', 'jenis_kelamin' => 'nullable|in:L,P',
            'golongan_darah' => 'nullable|in:A,B,AB,O', 'alamat' => 'nullable|string', 'alergi' => 'nullable|string',
            'kontak_darurat' => 'nullable|string|max:100',
        ];
    }

    public function index(Request $r)
    {
        $q = Patient::orderByDesc('id');
        if ($s = $r->query('q')) {
            $q->where(fn ($w) => $w->where('nama', 'ilike', "%$s%")->orWhere('no_rm', 'ilike', "%$s%")->orWhere('nik', 'like', "%$s%"));
        }
        return $q->paginate(15);
    }

    public function store(Request $r)
    {
        $p = Patient::create($r->validate($this->rules()) + ['no_rm' => Patient::nextRm()]);
        AuditService::log('pasien.buat', 'patient:'.$p->id);
        return response()->json($p, 201);
    }

    public function update(Request $r, Patient $patient)
    {
        $patient->update($r->validate($this->rules($patient)));
        AuditService::log('pasien.ubah', 'patient:'.$patient->id);
        return $patient;
    }

    public function destroy(Patient $patient)
    {
        try { $patient->delete(); } catch (QueryException) { abort(409, 'Pasien memiliki kunjungan/rekam medis dan tidak dapat dihapus.'); }
        AuditService::log('pasien.hapus', 'patient:'.$patient->id);
        return ['message' => 'Data pasien dihapus.'];
    }
}
