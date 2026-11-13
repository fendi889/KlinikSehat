<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $table = 'stock_movements';
    protected $guarded = [];

    public function batch() { return $this->belongsTo(MedicineBatch::class, 'batch_id'); }
    public function user() { return $this->belongsTo(User::class); }
}
