<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\Poli;
use App\Services\AuditService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PoliController extends Controller
{
    private function rules(?Poli $p = null): array
    {
        return [
            'nama' => 'required|string|max:100',
            'kode' => ['required', 'alpha', 'max:3', Rule::unique('polis', 'kode')->ignore($p?->id)],
            'deskripsi' => 'nullable|string', 'aktif' => 'required|boolean',
        ];
    }

    public function index() { return Poli::withCount('doctors')->orderBy('id')->get(); }

    public function store(Request $r)
    {
        $d = $r->validate($this->rules());
        $d['kode'] = strtoupper($d['kode']);
        $p = Poli::create($d + ['clinic_id' => Clinic::firstOrFail()->id]);
        AuditService::log('poli.buat', 'poli:'.$p->id);
        return response()->json($p, 201);
    }

    public function update(Request $r, Poli $poli)
    {
        $d = $r->validate($this->rules($poli));
        $d['kode'] = strtoupper($d['kode']);
        $poli->update($d);
        AuditService::log('poli.ubah', 'poli:'.$poli->id);
        return $poli;
    }

    public function destroy(Poli $poli)
    {
        try { $poli->delete(); } catch (QueryException) { abort(409, 'Poli sudah dipakai dokter atau kunjungan. Nonaktifkan saja.'); }
        AuditService::log('poli.hapus', 'poli:'.$poli->id);
        return ['message' => 'Poli dihapus.'];
    }
}
