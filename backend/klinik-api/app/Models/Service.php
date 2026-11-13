<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $table = 'services';
    protected $guarded = [];

    public function poli()
    {
        return $this->belongsTo(Poli::class);
    }
}
