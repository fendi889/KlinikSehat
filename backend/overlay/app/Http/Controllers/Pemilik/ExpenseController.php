<?php

namespace App\Http\Controllers\Pemilik;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Services\AuditService;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    private array $rules = [
        'tanggal' => 'required|date|before_or_equal:today', 'kategori' => 'required|string|max:60',
        'keterangan' => 'nullable|string|max:255', 'jumlah' => 'required|numeric|min:1|max:10000000000',
    ];

    public function index(Request $r)
    {
        $q = Expense::orderByDesc('tanggal')->orderByDesc('id');
        if ($r->filled('from')) $q->where('tanggal', '>=', $r->query('from'));
        if ($r->filled('to')) $q->where('tanggal', '<=', $r->query('to'));
        return $q->paginate(15);
    }

    public function store(Request $r)
    {
        $e = Expense::create($r->validate($this->rules));
        AuditService::log('pengeluaran.buat', 'expense:'.$e->id, ['jumlah' => $e->jumlah]);
        return response()->json($e, 201);
    }

    public function update(Request $r, Expense $expense)
    {
        $expense->update($r->validate($this->rules));
        AuditService::log('pengeluaran.ubah', 'expense:'.$expense->id, ['jumlah' => $expense->jumlah]);
        return $expense;
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();
        AuditService::log('pengeluaran.hapus', 'expense:'.$expense->id);
        return ['message' => 'Pengeluaran dihapus.'];
    }
}
