<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AuditService;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    private const KEYS = ['pendaftaran_online_aktif', 'maks_antrian_per_poli', 'batas_batal_jam', 'email_kontak'];

    public function index() { return Setting::whereIn('key', self::KEYS)->pluck('value', 'key'); }

    public function update(Request $r)
    {
        $d = $r->validate([
            'pendaftaran_online_aktif' => 'required|in:0,1', 'maks_antrian_per_poli' => 'required|integer|min:1|max:500',
            'batas_batal_jam' => 'required|integer|min:0|max:72', 'email_kontak' => 'nullable|email',
        ]);
        foreach ($d as $k => $v) Setting::updateOrCreate(['key' => $k], ['value' => (string) $v]);
        AuditService::log('pengaturan.ubah', null, $d);
        return $this->index();
    }
}
