<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Services\AuditService;
use Illuminate\Http\Request;

class ClinicController extends Controller
{
    public function show() { return Clinic::firstOrFail(); }

    public function update(Request $r)
    {
        $d = $r->validate([
            'nama' => 'required|string|max:120', 'alamat' => 'nullable|string', 'telp' => 'nullable|string|max:30',
            'email' => 'nullable|email', 'jam_buka' => 'nullable|string|max:120',
        ]);
        $clinic = Clinic::firstOrFail();
        $clinic->update($d);
        AuditService::log('klinik.ubah', 'clinic:'.$clinic->id);
        return $clinic;
    }
}
