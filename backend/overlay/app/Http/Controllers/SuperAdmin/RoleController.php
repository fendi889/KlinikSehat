<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Services\AuditService;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index() { return Role::withCount('users')->with('permissions:id,slug')->orderBy('id')->get(); }

    public function permissions() { return Permission::orderBy('modul')->orderBy('slug')->get(); }

    public function syncPermissions(Request $r, Role $role)
    {
        abort_if($role->slug === 'super_admin', 422, 'Permission Super Admin tidak dapat diubah.');
        $d = $r->validate(['permission_ids' => 'array', 'permission_ids.*' => 'exists:permissions,id']);
        $role->permissions()->sync($d['permission_ids'] ?? []);
        AuditService::log('role.permission', 'role:'.$role->slug, ['jumlah' => count($d['permission_ids'] ?? [])]);
        return $role->load('permissions:id,slug')->loadCount('users');
    }
}
