<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicalDocument extends Model
{
    protected $table = 'medical_documents';
    protected $guarded = [];

    protected function casts(): array { return ['isi' => 'array']; }

    public function medicalRecord() { return $this->belongsTo(MedicalRecord::class); }
}
