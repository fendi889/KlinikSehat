<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    protected $table = 'prescriptions';
    protected $guarded = [];

    public function items() { return $this->hasMany(PrescriptionItem::class); }
    public function medicalRecord() { return $this->belongsTo(MedicalRecord::class); }
}
