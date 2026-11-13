import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { PageHeader, Pager, Empty, tglPanjang, isoDay } from '../../components/ui.jsx'
import { Field, Alert } from '../auth/AuthShell.jsx'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

function cetak(doc, dokter) {
  const p = doc.medical_record?.patient, i = doc.isi || {}
  const isi = doc.jenis === 'surat_sakit'
    ? `<p>Dokter yang bertanda tangan di bawah ini menerangkan bahwa:</p><p><b>${esc(p?.nama)}</b> (No. RM ${esc(p?.no_rm)})</p><p>perlu beristirahat selama <b>${esc(i.lama_hari)} hari</b>, mulai ${esc(tglPanjang(i.mulai))}.</p>${i.keterangan ? `<p>Keterangan: ${esc(i.keterangan)}</p>` : ''}`
    : `<p>Pasien <b>${esc(p?.nama)}</b> (No. RM ${esc(p?.no_rm)}) dijadwalkan kontrol pada <b>${esc(tglPanjang(i.tanggal))}</b>.</p>${i.catatan ? `<p>Catatan: ${esc(i.catatan)}</p>` : ''}`
  const w = window.open('', '_blank')
  if (!w) return alert('Izinkan pop-up untuk mencetak.')
  w.document.write(`<html><head><title>${esc(doc.judul)}</title><style>body{font-family:Georgia,serif;max-width:640px;margin:48px auto;line-height:1.6}h1{font-size:22px;border-bottom:2px solid #1e6fe0;padding-bottom:8px}.ttd{margin-top:80px}</style></head><body><h1>KlinikSehat – ${esc(doc.judul)}</h1>${isi}<p class="ttd">Dokter pemeriksa,<br><br><br><b>${esc(dokter)}</b></p></body></html>`)
  w.document.close(); w.focus(); w.print()
}

export default function Surat() {
  const { user } = useAuth()
  const [sp] = useSearchParams()
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [opsi, setOpsi] = useState([])
  const [f, setF] = useState({ visit: sp.get('visit') || '', jenis: 'surat_sakit', mulai: isoDay(), lama_hari: 2, keterangan: '', tanggal: isoDay(7), catatan: '' })
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [fe, setFe] = useState({})
  const load = useCallback(() => api(`/dokter/documents?page=${pg}`).then(setPage).catch((e) => setErr(e.message)), [pg])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    Promise.all([api('/dokter/queue'), api('/dokter/history')]).then(([q, h]) => {
      const a = q.filter((x) => ['dilayani', 'selesai'].includes(x.status)).map((x) => ({ id: x.visit_id, label: `${x.pasien} · hari ini` }))
      const b = h.data.map((x) => ({ id: x.id, label: `${x.pasien} · ${x.tanggal}` }))
      const seen = new Set(); setOpsi([...a, ...b].filter((o) => !seen.has(o.id) && seen.add(o.id)))
    }).catch(() => {})
  }, [])

  const kirim = async (e) => {
    e.preventDefault(); setErr(''); setOk(''); setFe({})
    const body = f.jenis === 'surat_sakit' ? { jenis: f.jenis, mulai: f.mulai, lama_hari: Number(f.lama_hari), keterangan: f.keterangan || null } : { jenis: f.jenis, tanggal: f.tanggal, catatan: f.catatan || null }
    try { await api(`/dokter/visits/${f.visit}/documents`, { method: 'POST', body }); setOk('Dokumen dibuat dan pasien diberi tahu.'); load() }
    catch (x) { setErr(x.message); setFe(Object.fromEntries(Object.entries(x.errors || {}).map(([k, v]) => [k, v[0]]))) }
  }
  const hapus = async (d) => { if (window.confirm(`Hapus ${d.judul}?`)) { try { await api(`/dokter/documents/${d.id}`, { method: 'DELETE' }); load() } catch (x) { setErr(x.message) } } }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const sel = 'min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3'

  return (
    <div className="max-w-3xl">
      <PageHeader title="Surat sakit dan jadwal kontrol" />
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      <form onSubmit={kirim} noValidate className="mb-8 grid gap-4 rounded-xl border border-brand-200 bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2"><label htmlFor="visit" className="mb-1 block text-sm font-semibold">Pasien / kunjungan</label>
          <select id="visit" className={sel} value={f.visit} onChange={set('visit')}><option value="">Pilih…</option>{f.visit && !opsi.some((o) => String(o.id) === String(f.visit)) && <option value={f.visit}>Kunjungan #{f.visit}</option>}{opsi.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
        <div><label htmlFor="jenis" className="mb-1 block text-sm font-semibold">Jenis</label>
          <select id="jenis" className={sel} value={f.jenis} onChange={set('jenis')}><option value="surat_sakit">Surat sakit</option><option value="jadwal_kontrol">Jadwal kontrol</option></select></div>
        {f.jenis === 'surat_sakit' ? <>
          <Field label="Mulai tanggal" name="mulai" type="date" value={f.mulai} onChange={set('mulai')} error={fe.mulai} />
          <Field label="Lama istirahat (hari)" name="lama_hari" type="number" value={f.lama_hari} onChange={set('lama_hari')} error={fe.lama_hari} />
          <Field label="Keterangan" name="keterangan" value={f.keterangan} onChange={set('keterangan')} error={fe.keterangan} />
        </> : <>
          <Field label="Tanggal kontrol" name="tanggal" type="date" value={f.tanggal} onChange={set('tanggal')} error={fe.tanggal} />
          <Field label="Catatan" name="catatan" value={f.catatan} onChange={set('catatan')} error={fe.catatan} />
        </>}
        <div className="md:col-span-2"><button className="btn btn-primary" disabled={!f.visit}>Buat dokumen</button></div>
      </form>

      <h2 className="mb-3 font-semibold">Dokumen yang sudah dibuat</h2>
      {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Belum ada dokumen.</Empty> : (
        <ul className="space-y-2">{page.data.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-white p-4">
            <span><b>{d.judul}</b><br /><span className="text-sm text-brand-700">{d.medical_record?.patient?.nama} · {tglPanjang(d.medical_record?.visit?.tanggal)}</span></span>
            <span className="space-x-3"><button className="font-semibold text-brand-500" onClick={() => cetak(d, user.name)}>Cetak</button><button className="font-semibold text-red-600" onClick={() => hapus(d)}>Hapus</button></span>
          </li>))}</ul>
      )}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}
