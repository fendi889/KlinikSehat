import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api.js'
import { PageHeader, Empty } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function PemeriksaanList() {
  const [list, setList] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { api('/dokter/queue').then((r) => setList(r.filter((q) => q.status === 'dilayani'))).catch((e) => setErr(e.message)) }, [])
  return (
    <div className="max-w-3xl">
      <PageHeader title="Pemeriksaan berlangsung" desc="Pasien yang sedang Anda periksa. Mulai pemeriksaan dari menu Antrian." />
      <Alert>{err}</Alert>
      {list && (list.length === 0 ? <Empty>Tidak ada pemeriksaan yang sedang berlangsung. <Link className="font-semibold text-brand-500" to="/dokter/antrian">Buka antrian</Link></Empty> : (
        <ul className="space-y-3">{list.map((q) => (
          <li key={q.id} className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-white p-4">
            <span><b>{q.kode}</b> · {q.pasien}</span><Link className="btn btn-primary min-h-[40px]" to={`/dokter/pemeriksaan/${q.visit_id}`}>Lanjutkan</Link>
          </li>))}</ul>
      ))}
    </div>
  )
}
