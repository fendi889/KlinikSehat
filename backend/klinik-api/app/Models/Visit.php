<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Visit extends Model
{
    protected $guarded = [];

    public function patient() { return $this->belongsTo(Patient::class); }
    public function doctor() { return $this->belongsTo(Doctor::class); }
    public function poli() { return $this->belongsTo(Poli::class); }
    public function queue() { return $this->hasOne(Queue::class); }
    public function vitalSign() { return $this->hasOne(VitalSign::class); }
    public function medicalRecord() { return $this->hasOne(MedicalRecord::class); }

    protected function casts(): array { return ['tanggal' => 'date:Y-m-d']; }

    public function invoice() { return $this->hasOne(Invoice::class); }

    public function room() { return $this->belongsTo(Room::class); }
}
