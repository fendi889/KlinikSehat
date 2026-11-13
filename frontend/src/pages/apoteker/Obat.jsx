import { useState } from 'react'
import CrudPage from '../../components/CrudPage.jsx'
import ExportButton from './ExportButton.jsx'
import { rupiah } from '../../components/ui.jsx'

export default function Obat() {
  const [err, setErr] = useState('')
  return (
    <div>
      {err && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <CrudPage title="Data obat" desc="Stok dihitung dari batch yang belum kedaluwarsa. Stok ditambah lewat menu Stok & batch." endpoint="/apoteker/medicines" searchable nounHapus="obat"
        extraAction={<ExportButton jenis="obat" onError={setErr} />}
        optionSources={{ category_id: { endpoint: '/apoteker/categories', label: 'nama' } }}
        blank={{ kode: '', nama: '', category_id: '', satuan: 'tablet', harga_jual: 0, stok_minimum: 10 }}
        columns={[{ key: 'kode', label: 'Kode' }, { key: 'nama', label: 'Nama obat' }, { key: 'kategori_nama', label: 'Kategori' }, { key: 'satuan', label: 'Satuan' },
          { label: 'Harga jual', render: (r) => rupiah(r.harga_jual) },
          { label: 'Stok', render: (r) => <span className={r.rendah ? 'font-semibold text-red-600' : ''}>{r.stok}{r.rendah && ' (rendah)'}</span> }, { key: 'stok_minimum', label: 'Minimum' }]}
        fields={[
          { name: 'kode', label: 'Kode obat', required: true }, { name: 'nama', label: 'Nama obat', required: true },
          { name: 'category_id', label: 'Kategori', type: 'select' }, { name: 'satuan', label: 'Satuan (tablet, botol, …)', required: true },
          { name: 'harga_jual', label: 'Harga jual per satuan (Rp)', type: 'number', required: true }, { name: 'stok_minimum', label: 'Stok minimum (peringatan)', type: 'number', required: true },
        ]} />
    </div>
  )
}
