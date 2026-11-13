<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicineBatch extends Model
{
    protected $table = 'medicine_batches';
    protected $guarded = [];

    public function medicine() { return $this->belongsTo(Medicine::class); }
}
