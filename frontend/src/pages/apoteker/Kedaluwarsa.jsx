import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, TableWrap, Th, Td } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Kedaluwarsa() {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { const load = () => api('/apoteker/alerts').then(setD).catch((e) => setErr(e.message)); load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [])
  const batch = (rows, kosong) => (
    <TableWrap><thead><tr><Th>Obat</Th><Th>Batch</Th><Th>Kedaluwarsa</Th><Th>Stok</Th></tr></thead>
      <tbody>{rows.length ? rows.map((b) => <tr key={b.id}><Td>{b.obat}</Td><Td>{b.no_batch}</Td><Td>{b.tgl_kedaluwarsa}</Td><Td>{b.stok} {b.satuan}</Td></tr>) : <tr><Td>{kosong}</Td><Td /><Td /><Td /></tr>}</tbody></TableWrap>
  )
  return (
    <div className="max-w-4xl">
      <PageHeader title="Kedaluwarsa dan peringatan stok" desc="Stok batch kedaluwarsa tidak dipakai untuk resep. Keluarkan lewat Stok & batch > Sesuaikan." />
      <Alert>{err}</Alert>
      {d && <div className="space-y-8">
        <section><h2 className="mb-3 font-semibold text-red-600">Sudah kedaluwarsa ({d.kedaluwarsa.length})</h2>{batch(d.kedaluwarsa, 'Tidak ada batch kedaluwarsa yang masih berstok.')}</section>
        <section><h2 className="mb-3 font-semibold text-yellow-700">Kedaluwarsa dalam 30 hari ({d.segera.length})</h2>{batch(d.segera, 'Tidak ada.')}</section>
        <section><h2 className="mb-3 font-semibold">Stok di bawah minimum ({d.stok_rendah.length})</h2>
          <TableWrap><thead><tr><Th>Obat</Th><Th>Stok aktif</Th><Th>Minimum</Th></tr></thead>
            <tbody>{d.stok_rendah.length ? d.stok_rendah.map((o) => <tr key={o.id}><Td>{o.nama}<span className="block text-xs text-brand-700">{o.kode}</span></Td><Td className="font-semibold text-red-600">{Number(o.stok)} {o.satuan}</Td><Td>{o.stok_minimum}</Td></tr>) : <tr><Td>Semua stok aman.</Td><Td /><Td /></tr>}</tbody></TableWrap></section>
      </div>}
    </div>
  )
}
