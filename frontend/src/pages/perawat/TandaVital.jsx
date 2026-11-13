import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../services/api.js'
import { PageHeader, StatusBadge, Empty } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

const VITALS = [['td_sistol', 'TD sistol (mmHg)'], ['td_diastol', 'TD diastol (mmHg)'], ['nadi', 'Nadi (/mnt)'], ['suhu', 'Suhu (°C)'], ['napas', 'Napas (/mnt)'], ['spo2', 'SpO₂ (%)'], ['bb', 'BB (kg)'], ['tb', 'TB (cm)']]
const num = (v) => (v === '' || v == null ? null : Number(v))

export default function TandaVital() {
  const [sp] = useSearchParams()
  const [list, setList] = useState(null)
  const [pilih, setPilih] = useState(sp.get('visit') ? Number(sp.get('visit')) : null)
  const [info, setInfo] = useState(null)
  const [f, setF] = useState({})
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [fe, setFe] = useState({})
  const load = useCallback(() => api('/perawat/queue').then((r) => setList(r.antrian.filter((q) => ['terdaftar', 'diverifikasi', 'menunggu_dokter'].includes(q.visit_status)))).catch((e) => setErr(e.message)), [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!pilih) { setInfo(null); return }
    setErr(''); setOk(''); setFe({})
    api(`/perawat/visits/${pilih}/vitals`).then((r) => { setInfo(r); setF(Object.fromEntries(VITALS.map(([k]) => [k, r.tanda_vital?.[k] ?? '']))) }).catch((e) => setErr(e.message))
  }, [pilih])

  const simpan = async (e) => {
    e.preventDefault(); setErr(''); setOk(''); setFe({})
    try { const r = await api(`/perawat/visits/${pilih}/vitals`, { method: 'PUT', body: Object.fromEntries(VITALS.map(([k]) => [k, num(f[k])])) }); setOk(r.message); setPilih(null); load() }
    catch (x) { setErr(x.message); setFe(Object.fromEntries(Object.entries(x.errors || {}).map(([k, v]) => [k, v[0]]))) }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Input tanda vital" desc="Setelah disimpan, pasien otomatis berstatus siap diperiksa dokter." />
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      {pilih && info && (
        <form onSubmit={simpan} className="mb-6 rounded-xl border border-brand-200 bg-white p-5" noValidate>
          <h2 className="font-semibold">{info.kode} · {info.pasien.nama} <span className="font-normal text-brand-700">· {info.pasien.no_rm}</span></h2>
          {info.pasien.alergi && <p className="mt-2 rounded-lg bg-yellow-50 p-2 text-sm text-yellow-800">Alergi: {info.pasien.alergi}</p>}
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {VITALS.map(([k, l]) => (
              <div key={k}><label htmlFor={k} className="mb-1 block text-xs font-semibold">{l}</label>
                <input id={k} type="number" step="any" className={`min-h-[44px] w-full rounded-lg border bg-white px-3 ${fe[k] ? 'border-red-500' : 'border-brand-200'}`} value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
                {fe[k] && <p className="mt-1 text-xs text-red-600">{fe[k]}</p>}</div>
            ))}
          </div>
          <div className="mt-4 flex gap-3"><button className="btn btn-primary">Simpan</button><button type="button" className="btn btn-outline" onClick={() => setPilih(null)}>Batal</button></div>
        </form>
      )}
      {!list ? <p className="text-brand-700">Memuat…</p> : list.length === 0 ? <Empty>Tidak ada pasien yang menunggu pemeriksaan awal.</Empty> : (
        <ul className="space-y-2">{list.map((q) => (
          <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-white p-4">
            <span><b className="mr-2 font-display text-xl text-brand-500">{q.kode}</b>{q.pasien} <span className="text-sm text-brand-700">· {q.poli_nama}</span></span>
            <span className="flex items-center gap-3">{q.ada_tanda_vital && <StatusBadge status="selesai" />}<button className="btn btn-outline min-h-[40px]" onClick={() => setPilih(q.visit_id)}>{q.ada_tanda_vital ? 'Ubah' : 'Input'}</button></span>
          </li>))}</ul>
      )}
    </div>
  )
}
