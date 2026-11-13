<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Doctor extends Model
{
    protected $guarded = [];

    public function user() { return $this->belongsTo(User::class); }
    public function poli() { return $this->belongsTo(Poli::class); }
    public function schedules() { return $this->hasMany(Schedule::class); }
}
