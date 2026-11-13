import { useEffect, useState, useCallback } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Pager, StatusBadge, TableWrap, Th, Td, Empty, DateRange, rupiah, fmtTanggal, isoDay } from '../../components/ui.jsx'
import { cetakInvoice } from '../../components/printInvoice.js'
import { Alert } from '../auth/AuthShell.jsx'

const inp = 'min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3'

function Detail({ id, onChange, onClose }) {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [item, setItem] = useState({ deskripsi: '', qty: 1, harga: '' })
  const [diskon, setDiskon] = useState('')
  const [bayar, setBayar] = useState({ jumlah: '', metode: 'tunai', bukti: '' })
  const [terima, setTerima] = useState('')

  const apply = (r) => { setD(r); setDiskon(r.diskon); setBayar((b) => ({ ...b, jumlah: r.sisa || '' })); onChange() }
  useEffect(() => { api(`/admin/invoices/${id}`).then((r) => { setD(r); setDiskon(r.diskon); setBayar((b) => ({ ...b, jumlah: r.sisa || '' })) }).catch((e) => setErr(e.message)) }, [id])
  const aksi = (fn, pesan) => async (e) => {
    e?.preventDefault(); setErr(''); setOk('')
    try { apply(await fn()); if (pesan) setOk(pesan) } catch (x) { setErr(x.message + (x.errors && Object.values(x.errors)[0] ? ` (${Object.values(x.errors)[0][0]})` : '')) }
  }
  if (!d) return <div className="rounded-xl border border-brand-200 bg-white p-5">{err ? <Alert>{err}</Alert> : 'Memuat…'}</div>
  const terkunci = d.status === 'lunas' || d.pembayaran.some((p) => ['terverifikasi', 'menunggu_verifikasi'].includes(p.status))
  const kembalian = bayar.metode === 'tunai' && terima ? Number(terima) - Number(bayar.jumlah || 0) : null

  return (
    <section className="rounded-xl border border-brand-300 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-semibold">{d.nomor} · {d.pasien} <span className="font-normal text-brand-700">({d.no_rm})</span></h2><p className="text-sm text-brand-700">{d.poli} · {d.dokter}</p></div>
        <div className="flex gap-2"><StatusBadge status={d.status} /><button className="font-semibold text-brand-500" onClick={onClose}>Tutup</button></div>
      </div>
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>

      <TableWrap><thead><tr><Th>Rincian</Th><Th>Qty</Th><Th>Harga</Th><Th>Jumlah</Th><Th>{' '}</Th></tr></thead>
        <tbody>{d.items.map((i) => <tr key={i.id}><Td>{i.deskripsi}</Td><Td>{i.qty}</Td><Td>{rupiah(i.harga)}</Td><Td>{rupiah(i.qty * i.harga)}</Td>
          <Td>{!terkunci && <button className="font-semibold text-red-600" onClick={aksi(() => api(`/admin/invoices/${id}/items/${i.id}`, { method: 'DELETE' }), 'Item dihapus.')}>Hapus</button>}</Td></tr>)}</tbody></TableWrap>

      {!terkunci && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <form onSubmit={aksi(() => api(`/admin/invoices/${id}/items`, { method: 'POST', body: { deskripsi: item.deskripsi, qty: Number(item.qty), harga: Number(item.harga) } }), 'Item ditambahkan.')} className="flex flex-wrap gap-2">
            <input aria-label="Deskripsi item" placeholder="Tambah item" className={`${inp} flex-1`} value={item.deskripsi} onChange={(e) => setItem({ ...item, deskripsi: e.target.value })} />
            <input aria-label="Qty" type="number" min="1" className={`${inp} w-20`} value={item.qty} onChange={(e) => setItem({ ...item, qty: e.target.value })} />
            <input aria-label="Harga" type="number" placeholder="Harga" className={`${inp} w-32`} value={item.harga} onChange={(e) => setItem({ ...item, harga: e.target.value })} />
            <button className="btn btn-outline" disabled={!item.deskripsi || item.harga === ''}>Tambah</button>
          </form>
          <form onSubmit={aksi(() => api(`/admin/invoices/${id}`, { method: 'PUT', body: { diskon: Number(diskon || 0) } }), 'Diskon disimpan.')} className="flex gap-2">
            <input aria-label="Diskon (Rp)" type="number" min="0" placeholder="Diskon (Rp)" className={inp} value={diskon} onChange={(e) => setDiskon(e.target.value)} />
            <button className="btn btn-outline">Simpan diskon</button>
          </form>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
        <div><dt className="text-brand-700">Subtotal</dt><dd>{rupiah(d.subtotal)}</dd></div><div><dt className="text-brand-700">Diskon</dt><dd>{rupiah(d.diskon)}</dd></div>
        <div><dt className="text-brand-700">Total</dt><dd className="font-bold">{rupiah(d.total)}</dd></div><div><dt className="text-brand-700">Sisa tagihan</dt><dd className="font-bold text-brand-500">{rupiah(d.sisa)}</dd></div>
      </dl>

      <h3 className="mb-2 mt-5 font-semibold">Pembayaran</h3>
      {d.pembayaran.length === 0 ? <p className="text-sm text-brand-700">Belum ada pembayaran.</p> : (
        <ul className="space-y-2">{d.pembayaran.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-100 p-3 text-sm">
            <span><b>{rupiah(p.jumlah)}</b> · {p.metode}{p.bukti && ` · ref: ${p.bukti}`}<br /><span className="text-brand-700">{fmtTanggal(p.waktu)}{p.verifikator && ` · ${p.verifikator}`}</span></span>
            <span className="flex items-center gap-2"><StatusBadge status={p.status} />
              {p.status === 'menunggu_verifikasi' && <>
                <button className="font-semibold text-sehat" onClick={aksi(() => api(`/admin/payments/${p.id}/verify`, { method: 'POST', body: { aksi: 'terima' } }), 'Pembayaran diterima.')}>Terima</button>
                <button className="font-semibold text-red-600" onClick={aksi(() => api(`/admin/payments/${p.id}/verify`, { method: 'POST', body: { aksi: 'tolak' } }), 'Pembayaran ditolak.')}>Tolak</button></>}</span>
          </li>))}</ul>
      )}

      {d.status !== 'lunas' && d.sisa > 0 && (
        <form onSubmit={aksi(() => api(`/admin/invoices/${id}/payments`, { method: 'POST', body: { jumlah: Number(bayar.jumlah), metode: bayar.metode, bukti: bayar.bukti || null } }), 'Pembayaran dicatat.')} className="mt-4 grid gap-3 rounded-lg bg-brand-50 p-4 md:grid-cols-4">
          <div><label htmlFor="bj" className="mb-1 block text-xs font-semibold">Jumlah dibayar</label><input id="bj" type="number" className={inp} value={bayar.jumlah} onChange={(e) => setBayar({ ...bayar, jumlah: e.target.value })} /></div>
          <div><label htmlFor="bm" className="mb-1 block text-xs font-semibold">Metode</label><select id="bm" className={inp} value={bayar.metode} onChange={(e) => setBayar({ ...bayar, metode: e.target.value })}><option value="tunai">Tunai</option><option value="transfer">Transfer</option><option value="qris">QRIS</option><option value="debit">Kartu debit</option></select></div>
          {bayar.metode === 'tunai' ? <div><label htmlFor="bt" className="mb-1 block text-xs font-semibold">Uang diterima{kembalian !== null && kembalian >= 0 ? ` · kembali ${rupiah(kembalian)}` : ''}</label><input id="bt" type="number" className={inp} value={terima} onChange={(e) => setTerima(e.target.value)} /></div>
            : <div><label htmlFor="bb" className="mb-1 block text-xs font-semibold">No. referensi</label><input id="bb" className={inp} value={bayar.bukti} onChange={(e) => setBayar({ ...bayar, bukti: e.target.value })} /></div>}
          <div className="self-end"><button className="btn btn-primary w-full">Catat pembayaran</button></div>
        </form>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn btn-outline" onClick={() => cetakInvoice(d)}>Cetak invoice / simpan PDF</button>
        {d.status === 'lunas' && <button className="btn btn-outline" onClick={() => cetakInvoice(d, { struk: true })}>Cetak struk</button>}
      </div>
    </section>
  )
}

function Transaksi() {
  const [from, setFrom] = useState(isoDay(-29))
  const [to, setTo] = useState(isoDay())
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [err, setErr] = useState('')
  useEffect(() => { api(`/admin/transactions?${new URLSearchParams({ from, to, page: pg, ...(status && { status }) })}`).then(setPage).catch((e) => setErr(e.message)) }, [from, to, status, pg])
  return (
    <div>
      <DateRange from={from} to={to} onChange={(a, b) => { setFrom(a); setTo(b); setPg(1) }} />
      <select aria-label="Filter status" className="mb-4 min-h-[44px] rounded-lg border border-brand-200 bg-white px-3" value={status} onChange={(e) => { setStatus(e.target.value); setPg(1) }}>
        <option value="">Semua status</option><option value="terverifikasi">Terverifikasi</option><option value="menunggu_verifikasi">Menunggu verifikasi</option><option value="ditolak">Ditolak</option></select>
      <Alert>{err}</Alert>
      {page && <p className="mb-3 font-semibold">Total terverifikasi pada periode: {rupiah(page.total_terverifikasi)}</p>}
      {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Tidak ada transaksi.</Empty> : (
        <TableWrap><thead><tr><Th>Waktu</Th><Th>Invoice</Th><Th>Pasien</Th><Th>Metode</Th><Th>Jumlah</Th><Th>Status</Th><Th>Verifikator</Th></tr></thead>
          <tbody>{page.data.map((p) => <tr key={p.id}><Td>{fmtTanggal(p.waktu)}</Td><Td>{p.invoice}</Td><Td>{p.pasien}</Td><Td className="capitalize">{p.metode}</Td><Td>{rupiah(p.jumlah)}</Td><Td><StatusBadge status={p.status} /></Td><Td>{p.verifikator ?? '-'}</Td></tr>)}</tbody></TableWrap>
      )}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}

export default function Pembayaran() {
  const [tab, setTab] = useState('tagihan')
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [pilih, setPilih] = useState(null)
  const [err, setErr] = useState('')
  const load = useCallback(() => api(`/admin/invoices?${new URLSearchParams({ page: pg, ...(q && { q }), ...(status && { status }) })}`).then(setPage).catch((e) => setErr(e.message)), [pg, q, status])
  useEffect(() => { if (tab === 'tagihan') { load(); const t = setInterval(load, 15000); return () => clearInterval(t) } }, [load, tab])

  return (
    <div className="max-w-5xl">
      <PageHeader title="Pembayaran dan invoice" desc="Catat pembayaran di kasir, verifikasi pembayaran online pasien, dan cetak invoice atau struk." />
      <div className="mb-4 flex gap-2" role="tablist">
        {[['tagihan', 'Tagihan'], ['transaksi', 'Riwayat transaksi']].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`btn min-h-[40px] ${tab === k ? 'btn-primary' : 'btn-outline bg-white'}`}>{l}</button>)}
      </div>
      {tab === 'transaksi' ? <Transaksi /> : <>
        <div className="mb-4 flex flex-wrap gap-3">
          <input aria-label="Cari invoice" placeholder="Cari nomor invoice / nama / No. RM" className="min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3 sm:w-80" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} />
          <select aria-label="Filter status" className="min-h-[44px] rounded-lg border border-brand-200 bg-white px-3" value={status} onChange={(e) => { setStatus(e.target.value); setPg(1) }}>
            <option value="">Semua status</option><option value="belum_bayar">Belum bayar</option><option value="lunas">Lunas</option><option value="menunggu">Menunggu verifikasi</option></select>
        </div>
        <Alert>{err}</Alert>
        {pilih && <div className="mb-6"><Detail key={pilih} id={pilih} onChange={load} onClose={() => setPilih(null)} /></div>}
        {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Belum ada tagihan.</Empty> : (
          <TableWrap><thead><tr><Th>Invoice</Th><Th>Pasien</Th><Th>Tanggal</Th><Th>Total</Th><Th>Dibayar</Th><Th>Status</Th><Th>Aksi</Th></tr></thead>
            <tbody>{page.data.map((i) => (
              <tr key={i.id}><Td>{i.nomor}</Td><Td>{i.pasien}<span className="block text-xs text-brand-700">{i.no_rm}</span></Td><Td>{i.tanggal}</Td><Td>{rupiah(i.total)}</Td><Td>{rupiah(i.dibayar)}</Td>
                <Td><StatusBadge status={i.status} />{i.menunggu_verifikasi && <span className="mt-1 block text-xs font-semibold text-yellow-800">perlu verifikasi</span>}</Td>
                <Td><button className="font-semibold text-brand-500" onClick={() => setPilih(i.id)}>Buka</button></Td></tr>))}</tbody></TableWrap>
        )}
        <Pager page={page} onPage={setPg} />
      </>}
    </div>
  )
}
