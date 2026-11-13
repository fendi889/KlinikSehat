<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{
    protected $guarded = [];

    protected function casts(): array { return ['tanggal' => 'date:Y-m-d', 'called_at' => 'datetime']; }

    public function visit() { return $this->belongsTo(Visit::class); }
    public function poli() { return $this->belongsTo(Poli::class); }
}
