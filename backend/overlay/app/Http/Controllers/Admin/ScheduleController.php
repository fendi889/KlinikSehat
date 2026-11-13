<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Services\AuditService;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    private const HARI = [1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu', 7 => 'Minggu'];

    private array $rules = [
        'doctor_id' => 'required|exists:doctors,id', 'hari' => 'required|integer|between:1,7',
        'jam_mulai' => 'required|date_format:H:i', 'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
        'kuota' => 'required|integer|min:1|max:200', 'aktif' => 'required|boolean',
    ];

    private function flat(Schedule $s): array
    {
        return [
            'id' => $s->id, 'doctor_id' => $s->doctor_id, 'doctor_nama' => $s->doctor?->user?->name, 'poli_nama' => $s->doctor?->poli?->nama,
            'hari' => $s->hari, 'hari_nama' => self::HARI[$s->hari], 'jam_mulai' => substr($s->jam_mulai, 0, 5),
            'jam_selesai' => substr($s->jam_selesai, 0, 5), 'kuota' => $s->kuota, 'aktif' => $s->aktif,
        ];
    }

    private function bentrok(array $d, ?int $ignore = null): bool
    {
        return Schedule::where('doctor_id', $d['doctor_id'])->where('hari', $d['hari'])->where('aktif', true)
            ->when($ignore, fn ($q) => $q->where('id', '!=', $ignore))
            ->where('jam_mulai', '<', $d['jam_selesai'])->where('jam_selesai', '>', $d['jam_mulai'])->exists();
    }

    public function index(Request $r)
    {
        return Schedule::with('doctor.user:id,name', 'doctor.poli:id,nama')
            ->when($r->query('doctor_id'), fn ($q, $id) => $q->where('doctor_id', $id))
            ->orderBy('doctor_id')->orderBy('hari')->orderBy('jam_mulai')->get()->map(fn ($s) => $this->flat($s));
    }

    public function store(Request $r)
    {
        $d = $r->validate($this->rules);
        abort_if($d['aktif'] && $this->bentrok($d), 422, 'Jadwal bentrok dengan jadwal dokter yang sama pada hari tersebut.');
        $s = Schedule::create($d);
        AuditService::log('jadwal.buat', 'schedule:'.$s->id);
        return response()->json($this->flat($s->load('doctor.user:id,name', 'doctor.poli:id,nama')), 201);
    }

    public function update(Request $r, Schedule $schedule)
    {
        $d = $r->validate($this->rules);
        abort_if($d['aktif'] && $this->bentrok($d, $schedule->id), 422, 'Jadwal bentrok dengan jadwal dokter yang sama pada hari tersebut.');
        $schedule->update($d);
        AuditService::log('jadwal.ubah', 'schedule:'.$schedule->id);
        return $this->flat($schedule->load('doctor.user:id,name', 'doctor.poli:id,nama'));
    }

    public function destroy(Schedule $schedule)
    {
        $schedule->delete();
        AuditService::log('jadwal.hapus', 'schedule:'.$schedule->id);
        return ['message' => 'Jadwal dihapus.'];
    }
}
