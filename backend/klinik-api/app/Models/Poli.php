<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Poli extends Model
{
    protected $table = 'polis';
    protected $guarded = [];

    public function clinic() { return $this->belongsTo(Clinic::class); }
    public function doctors() { return $this->hasMany(Doctor::class); }
}
