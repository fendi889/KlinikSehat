<?php

namespace App\Http\Controllers\Apoteker;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Services\AuditService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ObatController extends Controller
{
    private const STOK_AKTIF = '(select coalesce(sum(b.stok), 0) from medicine_batches b where b.medicine_id = medicines.id and b.tgl_kedaluwarsa >= current_date)';

    private function flat(Medicine $m): array
    {
        $stok = (int) $m->stok;
        return ['id' => $m->id, 'kode' => $m->kode, 'nama' => $m->nama, 'category_id' => $m->category_id, 'kategori_nama' => $m->category?->nama,
            'satuan' => $m->satuan, 'harga_jual' => $m->harga_jual, 'stok_minimum' => $m->stok_minimum, 'stok' => $stok, 'rendah' => $stok < $m->stok_minimum];
    }

    private function rules(?Medicine $m = null): array
    {
        return [
            'kode' => ['required', 'string', 'max:30', 'regex:/^[A-Za-z0-9_-]+$/', Rule::unique('medicines', 'kode')->ignore($m?->id)],
            'nama' => 'required|string|max:150', 'category_id' => 'nullable|exists:medicine_categories,id', 'satuan' => 'required|string|max:20',
            'harga_jual' => 'required|numeric|min:0|max:100000000', 'stok_minimum' => 'required|integer|min:0|max:100000',
        ];
    }

    // ---------- Kategori ----------
    public function categories() { return MedicineCategory::withCount('medicines')->orderBy('nama')->get(); }

    public function storeCategory(Request $r)
    {
        $c = MedicineCategory::create($r->validate(['nama' => 'required|string|max:80|unique:medicine_categories,nama']));
        AuditService::log('kategori_obat.buat', 'category:'.$c->id);
        return response()->json($c, 201);
    }

    public function updateCategory(Request $r, int $id)
    {
        $c = MedicineCategory::findOrFail($id);
        $c->update($r->validate(['nama' => ['required', 'string', 'max:80', Rule::unique('medicine_categories', 'nama')->ignore($c->id)]]));
        return $c;
    }

    public function destroyCategory(int $id)
    {
        $c = MedicineCategory::findOrFail($id);
        abort_if(Medicine::where('category_id', $c->id)->exists(), 409, 'Kategori masih dipakai obat.');
        $c->delete();
        return ['message' => 'Kategori dihapus.'];
    }

    // ---------- Obat ----------
    public function options() { return Medicine::orderBy('nama')->get(['id', 'kode', 'nama', 'satuan']); }

    public function index(Request $r)
    {
        $q = Medicine::with('category:id,nama')->selectRaw('medicines.*, '.self::STOK_AKTIF.' as stok')->orderBy('nama');
        if ($s = $r->query('q')) $q->where(fn ($w) => $w->where('nama', 'ilike', "%$s%")->orWhere('kode', 'ilike', "%$s%"));
        if ($r->filled('category_id')) $q->where('category_id', $r->query('category_id'));
        if ($r->query('status') === 'rendah') $q->whereRaw(self::STOK_AKTIF.' < medicines.stok_minimum');
        return $q->paginate(15)->through(fn ($m) => $this->flat($m));
    }

    public function store(Request $r)
    {
        $m = Medicine::create($r->validate($this->rules()));
        AuditService::log('obat.buat', 'medicine:'.$m->id);
        return response()->json($this->flat($m->load('category:id,nama')), 201);
    }

    public function update(Request $r, Medicine $medicine)
    {
        $medicine->update($r->validate($this->rules($medicine)));
        AuditService::log('obat.ubah', 'medicine:'.$medicine->id);
        $medicine->stok = $medicine->batches()->where('tgl_kedaluwarsa', '>=', today())->sum('stok');
        return $this->flat($medicine->load('category:id,nama'));
    }

    public function destroy(Medicine $medicine)
    {
        abort_if($medicine->batches()->where('stok', '>', 0)->exists(), 409, 'Obat masih memiliki stok. Kosongkan stok lebih dulu.');
        try { $medicine->delete(); } catch (QueryException) { abort(409, 'Obat memiliki riwayat stok atau resep dan tidak dapat dihapus.'); }
        AuditService::log('obat.hapus', 'medicine:'.$medicine->id);
        return ['message' => 'Obat dihapus.'];
    }
}
