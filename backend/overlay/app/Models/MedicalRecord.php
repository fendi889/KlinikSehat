<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicalRecord extends Model
{
    protected $table = 'medical_records';
    protected $guarded = [];

    public function visit() { return $this->belongsTo(Visit::class); }
    public function diagnoses() { return $this->hasMany(Diagnosis::class); }
    public function procedures() { return $this->hasMany(Procedure::class); }
    public function prescriptions() { return $this->hasMany(Prescription::class); }

    public function documents() { return $this->hasMany(MedicalDocument::class); }
    public function patient() { return $this->belongsTo(Patient::class); }
}
