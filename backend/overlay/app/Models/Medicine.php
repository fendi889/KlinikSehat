<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    protected $table = 'medicines';
    protected $guarded = [];

    public function batches() { return $this->hasMany(MedicineBatch::class); }

    public function category() { return $this->belongsTo(MedicineCategory::class, 'category_id'); }
}
