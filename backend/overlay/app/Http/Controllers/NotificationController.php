<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use Illuminate\Http\Request;

/** Notifikasi untuk semua role (lonceng di dashboard). */
class NotificationController extends Controller
{
    public function index(Request $r) { return AppNotification::where('user_id', $r->user()->id)->latest('id')->paginate(15); }

    public function unread(Request $r) { return ['jumlah' => AppNotification::where('user_id', $r->user()->id)->whereNull('dibaca_at')->count()]; }

    public function read(Request $r, int $id)
    {
        AppNotification::where('user_id', $r->user()->id)->whereKey($id)->whereNull('dibaca_at')->update(['dibaca_at' => now()]);
        return ['message' => 'ok'];
    }

    public function readAll(Request $r)
    {
        AppNotification::where('user_id', $r->user()->id)->whereNull('dibaca_at')->update(['dibaca_at' => now()]);
        return ['message' => 'ok'];
    }
}
