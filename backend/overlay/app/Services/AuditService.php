<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditService
{
    public static function log(string $aksi, ?string $target = null, array $detail = [], ?int $userId = null): void
    {
        AuditLog::create([
            'user_id' => $userId ?? auth()->id(), 'aksi' => $aksi, 'target' => $target,
            'detail' => $detail ?: null, 'ip' => request()->ip(),
        ]);
    }
}
