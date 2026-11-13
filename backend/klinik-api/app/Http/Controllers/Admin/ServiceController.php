<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Services\AuditService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    private array $rules = [
        'nama' => 'required|string|max:120', 'poli_id' => 'nullable|exists:polis,id', 'deskripsi' => 'nullable|string',
        'tarif' => 'required|numeric|min:0|max:100000000', 'aktif' => 'required|boolean',
    ];

    private function flat(Service $s): array { return $s->toArray() + ['poli_nama' => $s->poli?->nama]; }

    public function index() { return Service::with('poli:id,nama')->orderBy('nama')->get()->map(fn ($s) => $this->flat($s)); }

    public function store(Request $r)
    {
        $s = Service::create($r->validate($this->rules));
        AuditService::log('layanan.buat', 'service:'.$s->id, ['tarif' => $s->tarif]);
        return response()->json($this->flat($s->load('poli:id,nama')), 201);
    }

    public function update(Request $r, Service $service)
    {
        $old = $service->tarif;
        $service->update($r->validate($this->rules));
        AuditService::log('layanan.ubah', 'service:'.$service->id, ['tarif_lama' => $old, 'tarif_baru' => $service->tarif]);
        return $this->flat($service->load('poli:id,nama'));
    }

    public function destroy(Service $service)
    {
        try { $service->delete(); } catch (QueryException) { abort(409, 'Layanan sudah dipakai. Nonaktifkan saja.'); }
        AuditService::log('layanan.hapus', 'service:'.$service->id);
        return ['message' => 'Layanan dihapus.'];
    }
}
