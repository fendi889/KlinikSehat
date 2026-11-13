import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api.js'
import { PageHeader, tglPanjang } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Daftar() {
  const [sp] = useSearchParams() // ?poli=ID&tanggal=YYYY-MM-DD dari form beranda
  const [polis, setPolis] = useState(null)
  const [poliId, setPoliId] = useState(sp.get('poli') || '')
  const [doc, setDoc] = useState(null)
  const [slots, setSlots] = useState(null)
  const [slot, setSlot] = useState(null)
  const [keluhan, setKeluhan] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [hasil, setHasil] = useState(null)

  useEffect(() => { api('/pasien/options').then(setPolis).catch((e) => setErr(e.message)) }, [])
  const poli = polis?.find((p) => String(p.id) === String(poliId))

  const pilihDokter = (d) => {
    setDoc(d); setSlot(null); setSlots(null); setErr('')
    api(`/pasien/slots?doctor_id=${d.id}`).then((r) => { setSlots(r); const m = r.find((x) => x.tanggal === sp.get('tanggal') && x.sisa > 0); if (m) setSlot(m) }).catch((e) => setErr(e.message))
  }
  const kirim = async () => {
    setBusy(true); setErr('')
    try { setHasil(await api('/pasien/visits', { method: 'POST', body: { doctor_id: doc.id, tanggal: slot.tanggal, keluhan: keluhan || null } })) }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  if (hasil) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-brand-200 bg-white p-8 text-center">
        <p className="text-brand-700">Pendaftaran berhasil. Nomor antrian Anda</p>
        <p className="my-3 font-display text-6xl font-bold text-brand-500">{hasil.kode}</p>
        <p className="font-semibold">{hasil.poli_nama} · {hasil.doctor_nama}</p>
        <p className="text-brand-700">{tglPanjang(hasil.tanggal)}, praktik {hasil.jam}</p>
        <Link to="/pasien/antrian" className="btn btn-primary mt-6">Pantau antrian</Link>
        <button className="btn btn-outline mt-3 w-full" onClick={() => { setHasil(null); setDoc(null); setSlot(null); setSlots(null); setKeluhan('') }}>Daftar lagi</button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Daftar online" desc="Pilih poli, dokter, dan tanggal praktik. Nomor antrian terbit otomatis." />
      <Alert>{err}</Alert>
      {!polis ? <p className="text-brand-700">Memuat…</p> : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 font-semibold">1. Pilih poli</h2>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Poli">
              {polis.map((p) => (
                <button key={p.id} role="radio" aria-checked={String(p.id) === String(poliId)} onClick={() => { setPoliId(p.id); setDoc(null); setSlots(null); setSlot(null) }}
                  className={`btn min-h-[44px] ${String(p.id) === String(poliId) ? 'btn-primary' : 'btn-outline bg-white'}`}>{p.nama}</button>
              ))}
            </div>
          </section>

          {poli && (
            <section>
              <h2 className="mb-2 font-semibold">2. Pilih dokter</h2>
              {poli.dokter.length === 0 ? <p className="text-brand-700">Belum ada dokter di poli ini.</p> : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {poli.dokter.map((d) => (
                    <button key={d.id} onClick={() => pilihDokter(d)} aria-pressed={doc?.id === d.id}
                      className={`rounded-xl border p-4 text-left ${doc?.id === d.id ? 'border-brand-500 bg-brand-100' : 'border-brand-200 bg-white'}`}>
                      <span className="block font-semibold">{d.nama}</span>
                      <span className="block text-sm text-brand-700">{d.spesialis || poli.nama} · {d.pengalaman_tahun} th</span>
                      <span className="mt-1 block text-xs text-brand-700">{d.jadwal.length ? d.jadwal.join(', ') : 'Belum ada jadwal'}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {doc && (
            <section>
              <h2 className="mb-2 font-semibold">3. Pilih tanggal praktik</h2>
              {!slots ? <p className="text-brand-700">Memuat jadwal…</p> : slots.length === 0 ? <p className="text-brand-700">Tidak ada jadwal praktik dalam 14 hari ke depan.</p> : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {slots.map((s) => (
                    <button key={s.tanggal + s.jam} disabled={s.sisa === 0} onClick={() => setSlot(s)} aria-pressed={slot?.tanggal === s.tanggal && slot?.jam === s.jam}
                      className={`rounded-xl border p-3 text-left disabled:opacity-50 ${slot?.tanggal === s.tanggal && slot?.jam === s.jam ? 'border-brand-500 bg-brand-100' : 'border-brand-200 bg-white'}`}>
                      <span className="block font-semibold">{tglPanjang(s.tanggal)}</span>
                      <span className="text-sm text-brand-700">{s.jam} · {s.sisa === 0 ? 'Penuh' : `sisa ${s.sisa} kuota`}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {slot && (
            <section>
              <h2 className="mb-2 font-semibold">4. Keluhan (opsional)</h2>
              <textarea aria-label="Keluhan" rows={3} maxLength={500} value={keluhan} onChange={(e) => setKeluhan(e.target.value)} className="w-full rounded-lg border border-brand-200 bg-white p-3" />
              <button className="btn btn-primary mt-4" disabled={busy} onClick={kirim}>{busy ? 'Memproses…' : 'Ambil nomor antrian'}</button>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
