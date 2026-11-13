import { useEffect, useState, useCallback } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Pager, Empty, fmtTanggal } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Notifikasi({ base = '/pasien/notifications' }) {
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [err, setErr] = useState('')
  const load = useCallback(() => api(`${base}?page=${pg}`).then(setPage).catch((e) => setErr(e.message)), [pg])
  useEffect(() => { load() }, [load])
  const baca = async (n) => { if (!n.dibaca_at) { await api(`${base}/${n.id}/read`, { method: 'POST' }).catch(() => {}); load() } }
  const semua = async () => { await api(`${base}/read-all`, { method: 'POST' }).catch((e) => setErr(e.message)); load() }
  return (
    <div className="max-w-3xl">
      <PageHeader title="Notifikasi" action={<button className="btn btn-outline min-h-[40px]" onClick={semua}>Tandai semua dibaca</button>} />
      <Alert>{err}</Alert>
      {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Belum ada notifikasi.</Empty> : (
        <ul className="space-y-2">
          {page.data.map((n) => (
            <li key={n.id}>
              <button onClick={() => baca(n)} className={`w-full rounded-xl border p-4 text-left ${n.dibaca_at ? 'border-brand-100 bg-white' : 'border-brand-500 bg-brand-100'}`}>
                <span className="block font-semibold">{n.judul}</span>
                <span className="block text-sm">{n.pesan}</span>
                <span className="mt-1 block text-xs text-brand-700">{fmtTanggal(n.created_at)}{!n.dibaca_at && ' · baru'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}
