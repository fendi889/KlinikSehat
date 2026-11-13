import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api.js'
import { PageHeader, StatusBadge, tglPanjang } from '../../components/ui.jsx'
import RecordView from '../../components/RecordView.jsx'
import { Alert } from '../auth/AuthShell.jsx'

const VITALS = [['td_sistol', 'TD sistol (mmHg)'], ['td_diastol', 'TD diastol (mmHg)'], ['nadi', 'Nadi (/mnt)'], ['suhu', 'Suhu (°C)'], ['napas', 'Napas (/mnt)'], ['spo2', 'SpO₂ (%)'], ['bb', 'BB (kg)'], ['tb', 'TB (cm)']]
const num = (v) => (v === '' || v == null ? null : Number(v))
const ta = 'w-full rounded-lg border border-brand-200 bg-white p-3'
const inp = 'min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3'

export default function Exam() {
  const { visitId } = useParams()
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [f, setF] = useState(null)
  const [rx, setRx] = useState([])
  const [cari, setCari] = useState('')
  const [hasil, setHasil] = useState([])
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [warn, setWarn] = useState([])
  const [busy, setBusy] = useState(false)

  const apply = useCallback((p) => {
    setData(p)
    const mr = p.rekam_medis || {}
    setF({
      keluhan_utama: mr.keluhan_utama ?? p.visit.keluhan ?? '', riwayat_penyakit: mr.riwayat_penyakit ?? '', pemeriksaan_fisik: mr.pemeriksaan_fisik ?? '', catatan_dokter: mr.catatan_dokter ?? '',
      diagnoses: (mr.diagnoses || []).map((x) => ({ kode_icd: x.kode_icd ?? '', nama: x.nama })),
      procedures: (mr.procedures || []).map((x) => ({ nama: x.nama, biaya: x.biaya ?? 0 })),
      tv: Object.fromEntries(VITALS.map(([k]) => [k, p.tanda_vital?.[k] ?? ''])),
    })
    const r0 = mr.prescriptions?.[0]
    setRx(r0 ? r0.items.map((i) => ({ medicine_id: i.medicine_id, nama: i.medicine.nama, jumlah: i.jumlah, aturan_pakai: i.aturan_pakai })) : [])
  }, [])

  useEffect(() => { api(`/dokter/visits/${visitId}`).then(apply).catch((e) => setErr(e.message)) }, [visitId, apply])
  useEffect(() => {
    if (cari.length < 2) { setHasil([]); return }
    const t = setTimeout(() => api(`/dokter/medicines?q=${encodeURIComponent(cari)}`).then(setHasil).catch(() => {}), 300)
    return () => clearTimeout(t)
  }, [cari])

  if (err && !data) return <div className="max-w-xl"><Alert>{err}</Alert><Link to="/dokter/antrian" className="btn btn-outline mt-4">Kembali ke antrian</Link></div>
  if (!data || !f) return <p className="text-brand-700">Memuat…</p>

  const { pasien, visit } = data
  const aktif = visit.status === 'diperiksa'
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const setRow = (key, i, patch) => set(key, f[key].map((r, j) => (j === i ? { ...r, ...patch } : r)))

  const simpan = async () => {
    const r = await api(`/dokter/visits/${visitId}/exam`, {
      method: 'PUT',
      body: {
        keluhan_utama: f.keluhan_utama || null, riwayat_penyakit: f.riwayat_penyakit || null, pemeriksaan_fisik: f.pemeriksaan_fisik || null, catatan_dokter: f.catatan_dokter || null,
        diagnoses: f.diagnoses.filter((d) => d.nama.trim()).map((d) => ({ nama: d.nama, kode_icd: d.kode_icd || null })),
        procedures: f.procedures.filter((p) => p.nama.trim()).map((p) => ({ nama: p.nama, biaya: num(p.biaya) ?? 0 })),
        tanda_vital: Object.fromEntries(VITALS.map(([k]) => [k, num(f.tv[k])])),
      },
    })
    apply(r)
  }
  const aksi = (fn, pesan) => async () => {
    setBusy(true); setErr(''); setOk(''); setWarn([])
    try { await fn(); if (pesan) setOk(pesan) } catch (e) { setErr(e.message + (e.errors && Object.values(e.errors)[0] ? ` (${Object.values(e.errors)[0][0]})` : '')) } finally { setBusy(false) }
  }
  const simpanResep = async () => {
    const r = await api(`/dokter/visits/${visitId}/prescription`, { method: 'PUT', body: { items: rx.map((i) => ({ medicine_id: i.medicine_id, jumlah: Number(i.jumlah), aturan_pakai: i.aturan_pakai })) } })
    setWarn(r.peringatan)
  }
  const selesai = async () => {
    if (!window.confirm('Selesaikan pemeriksaan? Data tidak dapat diubah setelah ini dan tagihan dibuat otomatis.')) return
    await simpan(); await api(`/dokter/visits/${visitId}/finish`, { method: 'POST' }); nav('/dokter/antrian')
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title={pasien.nama} desc={`${pasien.no_rm} · ${pasien.umur ?? '-'} th · ${pasien.jenis_kelamin ?? '-'} · Gol. darah ${pasien.golongan_darah || '-'} · ${tglPanjang(visit.tanggal)} · ${visit.poli_nama}`}
        action={<StatusBadge status={visit.status} />} />
      {pasien.alergi && <p role="alert" className="mb-4 rounded-lg bg-yellow-50 p-3 font-semibold text-yellow-800">Alergi: {pasien.alergi}</p>}
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      {warn.map((w) => <p key={w} role="alert" className="mb-2 rounded-lg bg-yellow-50 p-3 text-yellow-800">{w}</p>)}

      {!aktif ? (
        <div className="rounded-xl border border-brand-200 bg-white p-5"><RecordView tanda_vital={data.tanda_vital} rekam_medis={data.rekam_medis} />
          <Link to="/dokter/antrian" className="btn btn-outline mt-4">Kembali ke antrian</Link></div>
      ) : (
        <div className="space-y-6">
          {data.riwayat_sebelumnya.length > 0 && (
            <section className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm"><h2 className="mb-1 font-semibold">Riwayat kunjungan sebelumnya</h2>
              <ul className="ml-5 list-disc">{data.riwayat_sebelumnya.map((x) => <li key={x.id}>{tglPanjang(x.tanggal)} · {x.dokter} · {x.diagnosa.join(', ') || 'tanpa diagnosa'}</li>)}</ul></section>
          )}

          <section className="rounded-xl border border-brand-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Tanda vital</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {VITALS.map(([k, l]) => (
                <div key={k}><label htmlFor={k} className="mb-1 block text-xs font-semibold">{l}</label>
                  <input id={k} type="number" step="any" className={inp} value={f.tv[k]} onChange={(e) => set('tv', { ...f.tv, [k]: e.target.value })} /></div>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-brand-200 bg-white p-5">
            <h2 className="font-semibold">Anamnesis dan pemeriksaan</h2>
            {[['keluhan_utama', 'Keluhan utama'], ['riwayat_penyakit', 'Riwayat penyakit'], ['pemeriksaan_fisik', 'Pemeriksaan fisik'], ['catatan_dokter', 'Catatan dokter']].map(([k, l]) => (
              <div key={k}><label htmlFor={k} className="mb-1 block text-sm font-semibold">{l}</label><textarea id={k} rows={2} className={ta} value={f[k]} onChange={(e) => set(k, e.target.value)} /></div>
            ))}
          </section>

          <section className="rounded-xl border border-brand-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Diagnosa *</h2>
            {f.diagnoses.map((d, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <input aria-label="Kode ICD" placeholder="ICD" className={`${inp} w-24`} value={d.kode_icd} onChange={(e) => setRow('diagnoses', i, { kode_icd: e.target.value })} />
                <input aria-label="Nama diagnosa" placeholder="Nama diagnosa" className={inp} value={d.nama} onChange={(e) => setRow('diagnoses', i, { nama: e.target.value })} />
                <button className="px-2 font-semibold text-red-600" aria-label="Hapus diagnosa" onClick={() => set('diagnoses', f.diagnoses.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button className="btn btn-outline min-h-[40px]" onClick={() => set('diagnoses', [...f.diagnoses, { kode_icd: '', nama: '' }])}>+ Tambah diagnosa</button>
          </section>

          <section className="rounded-xl border border-brand-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Tindakan medis</h2>
            {f.procedures.map((p, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <input aria-label="Nama tindakan" placeholder="Nama tindakan" className={inp} value={p.nama} onChange={(e) => setRow('procedures', i, { nama: e.target.value })} />
                <input aria-label="Biaya" type="number" placeholder="Biaya" className={`${inp} w-36`} value={p.biaya} onChange={(e) => setRow('procedures', i, { biaya: e.target.value })} />
                <button className="px-2 font-semibold text-red-600" aria-label="Hapus tindakan" onClick={() => set('procedures', f.procedures.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button className="btn btn-outline min-h-[40px]" onClick={() => set('procedures', [...f.procedures, { nama: '', biaya: 0 }])}>+ Tambah tindakan</button>
          </section>

          <div className="flex flex-wrap gap-3">
            <button className="btn btn-primary" disabled={busy} onClick={aksi(simpan, 'Pemeriksaan disimpan.')}>Simpan pemeriksaan</button>
          </div>

          <section className="rounded-xl border border-brand-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Resep</h2>
            <input aria-label="Cari obat" placeholder="Cari obat (min. 2 huruf)" className={inp} value={cari} onChange={(e) => setCari(e.target.value)} />
            {hasil.length > 0 && <ul className="mt-2 rounded-lg border border-brand-200">{hasil.map((m) => (
              <li key={m.id}><button className="flex w-full justify-between p-3 text-left hover:bg-brand-50" onClick={() => { if (!rx.some((x) => x.medicine_id === m.id)) setRx([...rx, { medicine_id: m.id, nama: m.nama, jumlah: 10, aturan_pakai: '' }]); setCari(''); setHasil([]) }}>
                <span>{m.nama}</span><span className="text-sm text-brand-700">stok {m.stok} {m.satuan}</span></button></li>))}</ul>}
            {rx.map((i, n) => (
              <div key={i.medicine_id} className="mt-3 grid gap-2 md:grid-cols-[1fr_6rem_1fr_auto]">
                <p className="self-center font-semibold">{i.nama}</p>
                <input aria-label={`Jumlah ${i.nama}`} type="number" min="1" className={inp} value={i.jumlah} onChange={(e) => setRx(rx.map((x, j) => (j === n ? { ...x, jumlah: e.target.value } : x)))} />
                <input aria-label={`Aturan pakai ${i.nama}`} placeholder="mis. 3 x 1 sesudah makan" className={inp} value={i.aturan_pakai} onChange={(e) => setRx(rx.map((x, j) => (j === n ? { ...x, aturan_pakai: e.target.value } : x)))} />
                <button className="px-2 font-semibold text-red-600" aria-label={`Hapus ${i.nama}`} onClick={() => setRx(rx.filter((_, j) => j !== n))}>✕</button>
              </div>
            ))}
            <button className="btn btn-outline mt-4 min-h-[40px]" disabled={busy || rx.length === 0} onClick={aksi(simpanResep, 'Resep disimpan.')}>Simpan resep</button>
          </section>

          <div className="flex flex-wrap gap-3 border-t border-brand-200 pt-4">
            <Link className="btn btn-outline" to={`/dokter/surat?visit=${visitId}`}>Surat sakit / jadwal kontrol</Link>
            <button className="btn btn-primary" disabled={busy} onClick={aksi(selesai)}>Selesaikan pemeriksaan</button>
          </div>
        </div>
      )}
    </div>
  )
}
