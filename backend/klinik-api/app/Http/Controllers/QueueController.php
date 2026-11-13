<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Queue;
use App\Services\QueueService;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    public function index(Request $r)
    {
        $q = Queue::with('visit.patient:id,nama,no_rm', 'poli:id,nama')->orderBy('nomor');
        $q->where('tanggal', $r->query('tanggal', now()->toDateString()));
        if ($r->filled('poli_id')) $q->where('poli_id', $r->query('poli_id'));
        if ($r->user()->role->slug === 'pasien') {
            $q->whereHas('visit.patient', fn ($p) => $p->where('user_id', $r->user()->id));
        }
        return $q->get();
    }

    public function store(Request $r, QueueService $svc)
    {
        $d = $r->validate([
            'patient_id' => 'nullable|exists:patients,id', 'poli_id' => 'required|exists:polis,id',
            'doctor_id' => 'required|exists:doctors,id', 'tanggal' => 'required|date|after_or_equal:today', 'keluhan' => 'nullable|string|max:500',
        ]);
        if ($r->user()->role->slug === 'pasien') { // pasien hanya boleh mendaftarkan dirinya sendiri
            $d['patient_id'] = Patient::where('user_id', $r->user()->id)->value('id');
        }
        abort_if(empty($d['patient_id']), 422, 'Pasien wajib dipilih.');
        abort_unless(Doctor::whereKey($d['doctor_id'])->where('poli_id', $d['poli_id'])->exists(), 422, 'Dokter tidak praktik di poli tersebut.');
        return response()->json($svc->register($d, $r->user()->id), 201);
    }

    public function call(Queue $queue)
    {
        $queue->update(['status' => 'dipanggil', 'called_at' => now()]);
        return $queue->fresh('visit.patient');
    }
}
