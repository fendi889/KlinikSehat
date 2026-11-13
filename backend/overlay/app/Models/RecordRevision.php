<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecordRevision extends Model
{
    protected $table = 'record_revisions';
    protected $guarded = [];

    protected function casts(): array { return ['perubahan' => 'array']; }

    public function user() { return $this->belongsTo(User::class); }
}
