import { useEffect, useState, useCallback } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Pager, TableWrap, Th, Td, Empty, rupiah, isoDay } from '../../components/ui.jsx'
import { Field, Alert } from '../auth/AuthShell.jsx'
import ExportButton from './ExportButton.jsx'

const sel = 'min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3'
const warna = { aktif: 'text-sehat', segera: 'text-yellow-700', kedaluwarsa: 'text-red-600', habis: 'text-brand-700' }
const label = { aktif: 'Aktif', segera: 'Segera kedaluwarsa', kedaluwarsa: 'Kedaluwarsa', habis: 'Habis' }

export default function Stok() {
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [obat, setObat] = useState([])
  const [form, setForm] = useState(null) // { tipe: 'masuk'|'koreksi', ... }
  const [fe, setFe] = useState({})
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => api(`/apoteker/batches?${new URLSearchParams({ page: pg, ...(q && { q }), ...(status && { status }) })}`).then(setPage).catch((e) => setErr(e.message)), [pg, q, status])
  useEffect(() => { load() }, [load])
  useEffect(() => { api('/apoteker/medicine-options').then(setObat).catch(() => {}) }, [])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const kirim = async (e) => {
    e.preventDefault(); setBusy(true); setErr(''); setOk(''); setFe({})
    try {
      if (form.tipe === 'masuk') await api('/apoteker/stock-in', { method: 'POST', body: { medicine_id: Number(form.medicine_id), no_batch: form.no_batch, tgl_kedaluwarsa: form.tgl_kedaluwarsa, jumlah: Number(form.jumlah), harga_beli: Number(form.harga_beli), keterangan: form.keterangan || null } })
      else await api('/apoteker/stock-adjust', { method: 'POST', body: { batch_id: form.batch_id, jenis: form.jenis, jumlah: Number(form.jumlah), keterangan: form.keterangan } })
      setOk(form.tipe === 'masuk' ? 'Stok masuk dicatat.' : 'Penyesuaian stok dicatat.'); setForm(null); load()
    } catch (x) { setErr(x.message); setFe(Object.fromEntries(Object.entries(x.errors || {}).map(([k, v]) => [k, v[0]]))) } finally { setBusy(false) }
  }

  return (
    <div className="max-w-5xl">
      <PageHeader title="Stok dan batch" desc="Setiap perubahan stok tercatat di Riwayat obat. Resep memakai batch dengan kedaluwarsa terdekat lebih dulu (FEFO)."
        action={<div className="flex flex-wrap gap-2"><ExportButton jenis="batch" query={status ? `status=${status}` : ''} onError={setErr} />
          <button className="btn btn-primary" onClick={() => { setForm({ tipe: 'masuk', medicine_id: '', no_batch: '', tgl_kedaluwarsa: isoDay(365), jumlah: '', harga_beli: '', keterangan: '' }); setFe({}); setErr(''); setOk('') }}>Stok masuk</button></div>} />
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>

      {form && (
        <form onSubmit={kirim} noValidate className="my-4 grid gap-4 rounded-xl border border-brand-200 bg-white p-5 md:grid-cols-2">
          <h2 className="font-semibold md:col-span-2">{form.tipe === 'masuk' ? 'Stok masuk' : `Penyesuaian: ${form.obat} · batch ${form.no_batch}`}</h2>
          {form.tipe === 'masuk' ? <>
            <div><label htmlFor="mid" className="mb-1 block text-sm font-semibold">Obat *</label>
              <select id="mid" className={sel} value={form.medicine_id} onChange={set('medicine_id')}><option value="">Pilih obat…</option>{obat.map((o) => <option key={o.id} value={o.id}>{o.nama} ({o.kode})</option>)}</select>
              {fe.medicine_id && <p className="mt-1 text-sm text-red-600">{fe.medicine_id}</p>}</div>
            <Field label="No. batch *" name="no_batch" value={form.no_batch} onChange={set('no_batch')} error={fe.no_batch} />
            <Field label="Tanggal kedaluwarsa *" name="tgl_kedaluwarsa" type="date" value={form.tgl_kedaluwarsa} onChange={set('tgl_kedaluwarsa')} error={fe.tgl_kedaluwarsa} />
            <Field label="Jumlah *" name="jumlah" type="number" value={form.jumlah} onChange={set('jumlah')} error={fe.jumlah} />
            <Field label="Harga beli per satuan (Rp) *" name="harga_beli" type="number" value={form.harga_beli} onChange={set('harga_beli')} error={fe.harga_beli} />
            <Field label="Keterangan (mis. pemasok)" name="keterangan" value={form.keterangan} onChange={set('keterangan')} error={fe.keterangan} />
          </> : <>
            <div><label htmlFor="jn" className="mb-1 block text-sm font-semibold">Jenis</label>
              <select id="jn" className={sel} value={form.jenis} onChange={set('jenis')}><option value="keluar">Stok keluar (rusak/dibuang)</option><option value="koreksi">Koreksi opname (+/−)</option></select></div>
            <Field label={form.jenis === 'keluar' ? 'Jumlah keluar *' : 'Selisih (+ tambah, − kurang) *'} name="jumlah" type="number" value={form.jumlah} onChange={set('jumlah')} error={fe.jumlah} />
            <div className="md:col-span-2"><Field label="Alasan *" name="keterangan" value={form.keterangan} onChange={set('keterangan')} error={fe.keterangan} /></div>
          </>}
          <div className="flex gap-3 md:col-span-2"><button className="btn btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button><button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Batal</button></div>
        </form>
      )}

      <div className="my-4 flex flex-wrap gap-3">
        <input aria-label="Cari obat" placeholder="Cari nama atau kode obat" className="min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3 sm:w-72" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} />
        <select aria-label="Filter status" className="min-h-[44px] rounded-lg border border-brand-200 bg-white px-3" value={status} onChange={(e) => { setStatus(e.target.value); setPg(1) }}>
          <option value="">Semua status</option><option value="aktif">Aktif</option><option value="segera">Segera kedaluwarsa</option><option value="kedaluwarsa">Kedaluwarsa</option><option value="habis">Habis</option>
        </select>
      </div>
      {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Belum ada batch. Tekan Stok masuk.</Empty> : (
        <TableWrap><thead><tr><Th>Obat</Th><Th>Batch</Th><Th>Kedaluwarsa</Th><Th>Stok</Th><Th>Harga beli</Th><Th>Status</Th><Th>Aksi</Th></tr></thead>
          <tbody>{page.data.map((b) => (
            <tr key={b.id}><Td>{b.obat}<span className="block text-xs text-brand-700">{b.kode}</span></Td><Td>{b.no_batch}</Td><Td>{b.tgl_kedaluwarsa}</Td><Td>{b.stok} {b.satuan}</Td><Td>{rupiah(b.harga_beli)}</Td>
              <Td><span className={`font-semibold ${warna[b.status]}`}>{label[b.status]}</span></Td>
              <Td><button className="font-semibold text-brand-500" onClick={() => { setForm({ tipe: 'koreksi', batch_id: b.id, obat: b.obat, no_batch: b.no_batch, jenis: 'keluar', jumlah: '', keterangan: '' }); setFe({}); setErr(''); setOk('') }}>Sesuaikan</button></Td></tr>))}</tbody></TableWrap>
      )}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}
