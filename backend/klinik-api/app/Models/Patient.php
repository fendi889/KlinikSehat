<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $guarded = [];

    public function user() { return $this->belongsTo(User::class); }
    public function visits() { return $this->hasMany(Visit::class); }

    public static function nextRm(): string
    {
        return 'RM-'.date('y').'-'.str_pad((string) ((self::max('id') ?? 0) + 1), 5, '0', STR_PAD_LEFT);
    }
}
