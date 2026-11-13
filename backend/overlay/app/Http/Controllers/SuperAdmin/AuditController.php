<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditController extends Controller
{
    public function index(Request $r)
    {
        $q = AuditLog::with('user:id,name,email')->latest('id');
        if ($s = $r->query('q')) $q->where('aksi', 'ilike', "%$s%");
        return $q->paginate(25);
    }

    /** Statistik keseluruhan + aktivitas terbaru untuk monitoring. */
    public function activity()
    {
        $count = fn (string $t) => DB::table($t)->count();
        return [
            'totals' => collect(['users', 'patients', 'doctors', 'visits', 'medical_records', 'invoices', 'medicines'])
                ->mapWithKeys(fn ($t) => [$t => $count($t)]),
            'users_by_role' => DB::table('roles')->leftJoin('users', 'users.role_id', '=', 'roles.id')
                ->groupBy('roles.id', 'roles.nama')->orderBy('roles.id')->get(['roles.nama', DB::raw('count(users.id) as jumlah')]),
            'sesi_aktif' => DB::table('personal_access_tokens')->count(),
            'login_24_jam' => DB::table('audit_logs')->where('aksi', 'login')->where('created_at', '>=', now()->subDay())->count(),
            'terbaru' => AuditLog::with('user:id,name')->latest('id')->take(10)->get(),
        ];
    }
}
