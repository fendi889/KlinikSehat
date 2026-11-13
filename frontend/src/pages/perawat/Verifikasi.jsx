import { useEffect, useState, useCallback } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Empty } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Verifikasi() {
  const [list, setList] = useState(null)
  const [cek, setCek] = useState({})
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const load = useCallback(() => api('/perawat/queue').then((r) => setList(r.antrian.filter((q) => q.visit_status === 'terdaftar' && q.status !== 'batal'))).catch((e) => setErr(e.message)), [])
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t) }, [load])
  const verif = async (q) => { setErr(''); setOk(''); try { const r = await api(`/perawat/visits/${q.visit_id}/verify`, { method: 'POST' }); setOk(`${q.kode}: ${r.message}`); load() } catch (e) { setErr(e.message) } }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Verifikasi pasien" desc="Cocokkan identitas pasien dengan data pendaftaran sebelum pemeriksaan awal." />
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      {!list ? <p className="text-brand-700">Memuat…</p> : list.length === 0 ? <Empty>Tidak ada pasien yang menunggu verifikasi.</Empty> : (
        <ul className="space-y-3">{list.map((q) => (
          <li key={q.id} className="rounded-xl border border-brand-200 bg-white p-4">
            <p className="font-semibold"><span className="mr-2 font-display text-2xl text-brand-500">{q.kode}</span>{q.pasien}</p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <div><dt className="text-brand-700">No. RM</dt><dd>{q.no_rm}</dd></div><div><dt className="text-brand-700">NIK</dt><dd>{q.nik || '-'}</dd></div>
              <div><dt className="text-brand-700">Umur / JK</dt><dd>{q.umur ?? '-'} th / {q.jenis_kelamin || '-'}</dd></div><div><dt className="text-brand-700">Dokter</dt><dd>{q.dokter}</dd></div>
            </dl>
            {q.alergi && <p className="mt-2 rounded-lg bg-yellow-50 p-2 text-sm text-yellow-800">Alergi: {q.alergi}</p>}
            <label className="mt-3 flex min-h-[44px] items-center gap-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5" checked={!!cek[q.id]} onChange={(e) => setCek({ ...cek, [q.id]: e.target.checked })} />Identitas pasien sudah dicocokkan</label>
            <button className="btn btn-primary mt-2 min-h-[40px]" disabled={!cek[q.id]} onClick={() => verif(q)}>Verifikasi</button>
          </li>))}</ul>
      )}
    </div>
  )
}
