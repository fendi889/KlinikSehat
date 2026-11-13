import { useEffect, useState } from 'react'
import { api, download } from '../services/api.js'
import { PageHeader, DateRange, TableWrap, Th, Td, Empty, StatCard, isoDay, esc, rupiah } from '../components/ui.jsx'
import { Alert } from './auth/AuthShell.jsx'

const fmt = (v, kolom) => (typeof v === 'number' && /\(Rp\)/.test(kolom) ? rupiah(v) : v ?? '-')
const fmtRingkas = (k, v) => (typeof v === 'number' && /\(Rp\)/.test(k) ? rupiah(v) : v)

function cetak(d) {
  const w = window.open('', '_blank', 'width=900,height=800')
  if (!w) return alert('Izinkan pop-up untuk mencetak.')
  const r = Object.entries(d.ringkasan).map(([k, v]) => `<tr><td>${esc(k)}</td><td><b>${esc(fmtRingkas(k, v))}</b></td></tr>`).join('')
  const h = d.kolom.map((k) => `<th>${esc(k)}</th>`).join('')
  const b = d.baris.map((row) => `<tr>${row.map((v, i) => `<td>${esc(fmt(v, d.kolom[i]))}</td>`).join('')}</tr>`).join('')
  w.document.write(`<html><head><title>${esc(d.judul)}</title><style>body{font-family:system-ui,sans-serif;margin:32px;color:#0a2a5e;font-size:12px}h1{font-size:20px;margin:0}table{border-collapse:collapse;width:100%;margin-top:12px}td,th{border:1px solid #c4dcff;padding:5px 7px;text-align:left}th{background:#e3efff}</style></head><body>
  <h1>KlinikSehat – ${esc(d.judul)}</h1><p>Periode ${esc(d.dari)} s.d. ${esc(d.sampai)}</p><table>${r}</table><table><thead><tr>${h}</tr></thead><tbody>${b}</tbody></table>
  <p style="margin-top:16px;font-size:10px">Dicetak ${esc(new Date().toLocaleString('id-ID'))}</p></body></html>`)
  w.document.close(); w.focus(); w.print()
}

export default function Laporan() {
  const [jenis, setJenis] = useState([])
  const [pilih, setPilih] = useState('')
  const [from, setFrom] = useState(isoDay(-29))
  const [to, setTo] = useState(isoDay())
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => { api('/laporan').then((r) => { setJenis(r); setPilih(r[0]?.kode || '') }).catch((e) => setErr(e.message)) }, [])
  useEffect(() => {
    if (!pilih) return
    setErr(''); setD(null)
    api(`/laporan/${pilih}?from=${from}&to=${to}`).then(setD).catch((e) => setErr(e.message))
  }, [pilih, from, to])

  const unduh = async (format) => {
    setBusy(format); setErr('')
    try { await download(`/laporan/${pilih}?from=${from}&to=${to}&format=${format}`, `laporan-${pilih}-${to}.${format}`) } catch (e) { setErr(e.message) } finally { setBusy('') }
  }

  return (
    <div className="max-w-5xl">
      <PageHeader title="Laporan" desc="Pilih jenis laporan dan periode. Ekspor ke Excel (.xlsx), CSV, atau cetak/simpan PDF." />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div><label htmlFor="jl" className="mb-1 block text-sm font-semibold">Jenis laporan</label>
          <select id="jl" className="min-h-[44px] rounded-lg border border-brand-200 bg-white px-3" value={pilih} onChange={(e) => setPilih(e.target.value)}>{jenis.map((j) => <option key={j.kode} value={j.kode}>{j.nama}</option>)}</select></div>
      </div>
      <DateRange from={from} to={to} onChange={(a, b) => { setFrom(a); setTo(b) }} />
      <Alert>{err}</Alert>
      {d && <>
        <div className="mb-4 flex flex-wrap gap-2">
          <button className="btn btn-primary" disabled={!!busy} onClick={() => unduh('xlsx')}>{busy === 'xlsx' ? 'Menyiapkan…' : 'Ekspor Excel (.xlsx)'}</button>
          <button className="btn btn-outline" disabled={!!busy} onClick={() => unduh('csv')}>CSV</button>
          <button className="btn btn-outline" onClick={() => cetak(d)}>Cetak / simpan PDF</button>
        </div>
        <dl className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">{Object.entries(d.ringkasan).map(([k, v]) => <StatCard key={k} label={k} value={fmtRingkas(k, v)} />)}</dl>
        {d.baris.length === 0 ? <Empty>Tidak ada data pada periode ini.</Empty> : (
          <TableWrap><thead><tr>{d.kolom.map((k) => <Th key={k}>{k}</Th>)}</tr></thead>
            <tbody>{d.baris.slice(0, 500).map((row, i) => <tr key={i}>{row.map((v, j) => <Td key={j}>{fmt(v, d.kolom[j])}</Td>)}</tr>)}</tbody></TableWrap>
        )}
        {d.baris.length > 500 && <p className="mt-2 text-sm text-brand-700">Menampilkan 500 dari {d.baris.length} baris. Ekspor untuk data lengkap.</p>}
      </>}
    </div>
  )
}
