<?php

namespace Database\Seeders;

use App\Models\Poli;
use App\Models\Room;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Poli::all() as $p) Room::firstOrCreate(['nama' => 'Ruang '.$p->nama], ['poli_id' => $p->id]);
        Room::firstOrCreate(['nama' => 'Ruang Tindakan']);
    }
}
