import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, tglPanjang, esc } from '../../components/ui.jsx'
import { Field, Alert } from '../auth/AuthShell.jsx'

const sel = 'min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3'
const blank = { nama: '', nik: '', tgl_lahir: '', jenis_kelamin: '', alamat: '', alergi: '', kontak_darurat: '' }

function cetak(h) {
  const w = window.open('', '_blank', 'width=360,height=480')
  if (!w) return alert('Izinkan pop-up untuk mencetak.')
  w.document.write(`<html><body style="font-family:sans-serif;text-align:center"><h3>KlinikSehat</h3><p>Nomor antrian</p><h1 style="font-size:64px;margin:8px">${esc(h.kode)}</h1><p><b>${esc(h.pasien)}</b><br>${esc(h.no_rm)}</p><p>${esc(h.poli_nama)}<br>${esc(h.doctor_nama)}<br>${esc(tglPanjang(h.tanggal))}, praktik ${esc(h.jam)}</p></body></html>`)
  w.document.close(); w.focus(); w.print()
}

export default function Pendaftaran() {
  const [q, setQ] = useState('')
  const [hasil, setHasil] = useState([])
  const [pasien, setPasien] = useState(null)
  const [baru, setBaru] = useState(null)
  const [fe, setFe] = useState({})
  const [polis, setPolis] = useState([])
  const [poliId, setPoliId] = useState('')
  const [dokterId, setDokterId] = useState('')
  const [slots, setSlots] = useState([])
  const [slot, setSlot] = useState('')
  const [keluhan, setKeluhan] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)

  useEffect(() => { api('/perawat/options').then(setPolis).catch((e) => setErr(e.message)) }, [])
  useEffect(() => {
    if (q.trim().length < 2) { setHasil([]); return }
    const t = setTimeout(() => api(`/perawat/patients?q=${encodeURIComponent(q)}`).then(setHasil).catch(() => {}), 300)
    return () => clearTimeout(t)
  }, [q])
  useEffect(() => {
    setSlots([]); setSlot('')
    if (dokterId) api(`/perawat/slots?doctor_id=${dokterId}`).then(setSlots).catch((e) => setErr(e.message))
  }, [dokterId])

  const poli = polis.find((p) => String(p.id) === String(poliId))
  const simpanBaru = async (e) => {
    e.preventDefault(); setErr(''); setFe({})
    try {
      const p = await api('/perawat/patients', { method: 'POST', body: Object.fromEntries(Object.entries(baru).map(([k, v]) => [k, v || null])) })
      setPasien(p); setBaru(null)
    } catch (x) { setErr(x.message); setFe(Object.fromEntries(Object.entries(x.errors || {}).map(([k, v]) => [k, v[0]]))) }
  }
  const daftar = async () => {
    setBusy(true); setErr('')
    try { setRes(await api('/perawat/visits', { method: 'POST', body: { patient_id: pasien.id, doctor_id: Number(dokterId), tanggal: slot, keluhan: keluhan || null } })) }
    catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const reset = () => { setRes(null); setPasien(null); setQ(''); setPoliId(''); setDokterId(''); setKeluhan('') }

  if (res) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-brand-200 bg-white p-8 text-center">
        <p className="text-brand-700">Nomor antrian</p>
        <p className="my-3 font-display text-6xl font-bold text-brand-500">{res.kode}</p>
        <p className="font-semibold">{res.pasien} · {res.no_rm}</p>
        <p className="text-brand-700">{res.poli_nama} · {res.doctor_nama}<br />{tglPanjang(res.tanggal)}, praktik {res.jam}</p>
        <button className="btn btn-primary mt-6 w-full" onClick={() => cetak(res)}>Cetak nomor antrian</button>
        <button className="btn btn-outline mt-3 w-full" onClick={reset}>Pasien berikutnya</button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Pendaftaran pasien langsung" desc="Untuk pasien yang datang tanpa mendaftar online." />
      <Alert>{err}</Alert>
      <div className="space-y-6">
        <section className="rounded-xl border border-brand-200 bg-white p-5">
          <h2 className="mb-2 font-semibold">1. Pasien</h2>
          {pasien ? (
            <p className="flex flex-wrap items-center justify-between gap-2"><span><b>{pasien.nama}</b> · {pasien.no_rm}{pasien.alergi && <span className="ml-2 text-yellow-800">alergi: {pasien.alergi}</span>}</span>
              <button className="font-semibold text-brand-500" onClick={() => setPasien(null)}>Ganti</button></p>
          ) : baru ? (
            <form onSubmit={simpanBaru} noValidate className="grid gap-3 md:grid-cols-2">
              <Field label="Nama lengkap *" name="nama" value={baru.nama} onChange={(e) => setBaru({ ...baru, nama: e.target.value })} error={fe.nama} />
              <Field label="NIK (16 digit)" name="nik" value={baru.nik} inputMode="numeric" maxLength={16} onChange={(e) => setBaru({ ...baru, nik: e.target.value })} error={fe.nik} />
              <Field label="Tanggal lahir" name="tgl_lahir" type="date" value={baru.tgl_lahir} onChange={(e) => setBaru({ ...baru, tgl_lahir: e.target.value })} error={fe.tgl_lahir} />
              <div><label htmlFor="jk" className="mb-1 block text-sm font-semibold">Jenis kelamin</label>
                <select id="jk" className={sel} value={baru.jenis_kelamin} onChange={(e) => setBaru({ ...baru, jenis_kelamin: e.target.value })}><option value="">Pilih…</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
              <Field label="Kontak darurat" name="kontak_darurat" value={baru.kontak_darurat} onChange={(e) => setBaru({ ...baru, kontak_darurat: e.target.value })} />
              <Field label="Alergi" name="alergi" value={baru.alergi} onChange={(e) => setBaru({ ...baru, alergi: e.target.value })} />
              <div className="md:col-span-2"><Field label="Alamat" name="alamat" value={baru.alamat} onChange={(e) => setBaru({ ...baru, alamat: e.target.value })} /></div>
              <div className="flex gap-3 md:col-span-2"><button className="btn btn-primary">Simpan pasien baru</button><button type="button" className="btn btn-outline" onClick={() => setBaru(null)}>Batal</button></div>
            </form>
          ) : (
            <>
              <input aria-label="Cari pasien" placeholder="Cari nama, No. RM, atau NIK (min. 2 karakter)" className={sel} value={q} onChange={(e) => setQ(e.target.value)} />
              {hasil.length > 0 && <ul className="mt-2 rounded-lg border border-brand-200">{hasil.map((p) => (
                <li key={p.id}><button className="flex w-full justify-between gap-2 p-3 text-left hover:bg-brand-50" onClick={() => setPasien(p)}><span>{p.nama}</span><span className="text-sm text-brand-700">{p.no_rm} · {p.tgl_lahir || 'tgl lahir -'}</span></button></li>))}</ul>}
              {q.trim().length >= 2 && hasil.length === 0 && <p className="mt-2 text-sm text-brand-700">Tidak ditemukan.</p>}
              <button className="btn btn-outline mt-3 min-h-[40px]" onClick={() => { setBaru({ ...blank, nama: q }); setFe({}) }}>+ Pasien baru</button>
            </>
          )}
        </section>

        {pasien && (
          <section className="space-y-3 rounded-xl border border-brand-200 bg-white p-5">
            <h2 className="font-semibold">2. Poli, dokter, dan jadwal</h2>
            <select aria-label="Poli" className={sel} value={poliId} onChange={(e) => { setPoliId(e.target.value); setDokterId('') }}><option value="">Pilih poli…</option>{polis.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}</select>
            {poli && <select aria-label="Dokter" className={sel} value={dokterId} onChange={(e) => setDokterId(e.target.value)}><option value="">Pilih dokter…</option>{poli.dokter.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}</select>}
            {dokterId && (slots.length === 0 ? <p className="text-sm text-brand-700">Tidak ada jadwal praktik 14 hari ke depan.</p> :
              <select aria-label="Tanggal praktik" className={sel} value={slot} onChange={(e) => setSlot(e.target.value)}><option value="">Pilih tanggal…</option>
                {slots.map((s) => <option key={s.tanggal + s.jam} value={s.tanggal} disabled={s.sisa === 0}>{tglPanjang(s.tanggal)} · {s.jam} · {s.sisa === 0 ? 'penuh' : `sisa ${s.sisa}`}</option>)}</select>)}
            {slot && <>
              <textarea aria-label="Keluhan" rows={2} placeholder="Keluhan (opsional)" className="w-full rounded-lg border border-brand-200 p-3" value={keluhan} onChange={(e) => setKeluhan(e.target.value)} />
              <button className="btn btn-primary" disabled={busy} onClick={daftar}>{busy ? 'Memproses…' : 'Daftarkan dan terbitkan nomor'}</button>
            </>}
          </section>
        )}
      </div>
    </div>
  )
}
