import { useEffect, useState, useCallback } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Pager, StatusBadge, Empty, tglPanjang, rupiah } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Resep() {
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [status, setStatus] = useState('aktif')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const load = useCallback(() => api(`/apoteker/prescriptions?status=${status}&page=${pg}`).then(setPage).catch((e) => setErr(e.message)), [status, pg])
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t) }, [load])

  const aksi = async (rx, path, konfirmasi) => {
    if (konfirmasi && !window.confirm(konfirmasi)) return
    setErr(''); setOk('')
    try { const r = await api(`/apoteker/prescriptions/${rx.id}/${path}`, { method: 'POST' }); setOk(r.message); load() } catch (e) { setErr(e.message) }
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title="Resep masuk" desc="Diperbarui otomatis tiap 10 detik. Stok berkurang otomatis (FEFO) saat obat disiapkan." />
      <select aria-label="Filter status" className="mb-4 min-h-[44px] rounded-lg border border-brand-200 bg-white px-3" value={status} onChange={(e) => { setStatus(e.target.value); setPg(1) }}>
        <option value="aktif">Perlu ditangani</option><option value="baru">Baru</option><option value="diproses">Diproses</option><option value="siap">Siap diambil</option><option value="diserahkan">Sudah diserahkan</option><option value="semua">Semua</option>
      </select>
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Tidak ada resep.</Empty> : (
        <div className="space-y-4">{page.data.map((rx) => (
          <article key={rx.id} className="rounded-xl border border-brand-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-semibold">Resep #{rx.id} · {rx.pasien} <span className="font-normal text-brand-700">({rx.no_rm})</span></p>
                <p className="text-sm text-brand-700">{rx.dokter} · {rx.tanggal ? tglPanjang(rx.tanggal) : '-'}</p></div>
              <StatusBadge status={rx.status} />
            </div>
            {rx.alergi && <p className="mt-2 rounded-lg bg-yellow-50 p-2 text-sm text-yellow-800">Alergi pasien: {rx.alergi}</p>}
            <ul className="mt-3 divide-y divide-brand-100 text-sm">
              {rx.items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span><b>{i.nama}</b> · {i.jumlah} {i.satuan} · {i.aturan_pakai}{i.peringatan_alergi && <b className="ml-2 text-red-600">cek alergi!</b>}</span>
                  <span className={i.cukup ? 'text-sehat font-semibold' : 'text-red-600 font-semibold'}>{['diserahkan', 'siap'].includes(rx.status) ? rupiah(i.harga_jual * i.jumlah) : `stok ${i.stok_tersedia}${i.cukup ? '' : ' (kurang)'}`}</span>
                </li>))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {rx.status === 'baru' && <button className="btn btn-outline min-h-[40px]" onClick={() => aksi(rx, 'process')}>Proses resep</button>}
              {['baru', 'diproses'].includes(rx.status) && <button className="btn btn-primary min-h-[40px]" disabled={!rx.semua_cukup} onClick={() => aksi(rx, 'ready', 'Siapkan obat? Stok akan berkurang otomatis dan biaya obat masuk ke tagihan.')}>Siapkan obat</button>}
              {['baru', 'diproses'].includes(rx.status) && !rx.semua_cukup && <span className="self-center text-sm text-red-600">Stok tidak cukup. Tambahkan stok masuk dulu.</span>}
              {rx.status === 'siap' && <button className="btn btn-primary min-h-[40px]" onClick={() => aksi(rx, 'dispense')}>Serahkan ke pasien</button>}
            </div>
          </article>))}</div>
      )}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}
