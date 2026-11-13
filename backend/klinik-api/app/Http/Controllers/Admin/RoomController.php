<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Services\AuditService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    private array $rules = ['nama' => 'required|string|max:100', 'poli_id' => 'nullable|exists:polis,id', 'aktif' => 'required|boolean'];

    private function flat(Room $r): array { return $r->toArray() + ['poli_nama' => $r->poli_id ? \App\Models\Poli::whereKey($r->poli_id)->value('nama') : null]; }

    public function index() { return Room::orderBy('id')->get()->map(fn ($r) => $this->flat($r)); }

    public function store(Request $r)
    {
        $room = Room::create($r->validate($this->rules));
        AuditService::log('ruang.buat', 'room:'.$room->id);
        return response()->json($this->flat($room), 201);
    }

    public function update(Request $r, Room $room)
    {
        $room->update($r->validate($this->rules));
        AuditService::log('ruang.ubah', 'room:'.$room->id);
        return $this->flat($room);
    }

    public function destroy(Room $room)
    {
        try { $room->delete(); } catch (QueryException) { abort(409, 'Ruang sudah dipakai. Nonaktifkan saja.'); }
        AuditService::log('ruang.hapus', 'room:'.$room->id);
        return ['message' => 'Ruang dihapus.'];
    }
}
