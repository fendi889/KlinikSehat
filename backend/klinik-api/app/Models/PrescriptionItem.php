<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrescriptionItem extends Model
{
    protected $table = 'prescription_items';
    protected $guarded = [];

    public function medicine() { return $this->belongsTo(Medicine::class); }
}
