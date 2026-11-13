import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api.js'
import { PageHeader, StatusBadge, Empty, tglPanjang } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Antrian() {
  const [list, setList] = useState(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const load = useCallback(() => api('/pasien/active').then(setList).catch((e) => setErr(e.message)), [])
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t) }, [load])

  const batal = async (v) => {
    if (!window.confirm(`Batalkan antrian ${v.antrian_kode}?`)) return
    setErr(''); setOk('')
    try { const r = await api(`/pasien/visits/${v.id}/cancel`, { method: 'POST' }); setOk(r.message); load() } catch (e) { setErr(e.message) }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Nomor antrian saya" desc="Status diperbarui otomatis tiap 5 detik." />
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      {!list ? <p className="text-brand-700">Memuat…</p> : list.length === 0 ? (
        <Empty>Tidak ada antrian aktif. <Link className="font-semibold text-brand-500" to="/pasien/daftar">Daftar online</Link></Empty>
      ) : (
        <div className="mt-4 space-y-4">
          {list.map((v) => (
            <article key={v.id} className="rounded-2xl border border-brand-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-brand-700">{tglPanjang(v.tanggal)}</p>
                  <p className="font-display text-5xl font-bold text-brand-500">{v.antrian_kode}</p>
                </div>
                <StatusBadge status={v.antrian_status} />
              </div>
              <p className="mt-3 font-semibold">{v.poli_nama} · {v.doctor_nama}</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-brand-700">Sedang dipanggil</dt><dd className="font-semibold">{v.sedang_dipanggil || '-'}</dd></div>
                <div><dt className="text-brand-700">Antrian di depan Anda</dt><dd className="font-semibold">{v.di_depan ?? '-'}</dd></div>
              </dl>
              {v.antrian_status === 'dipanggil' && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 font-semibold text-green-800">Nomor Anda sedang dipanggil. Silakan menuju ruang pemeriksaan.</p>}
              {v.antrian_status === 'terlewat' && <p role="alert" className="mt-4 rounded-lg bg-yellow-50 p-3 font-semibold text-yellow-800">Nomor Anda terlewat. Segera lapor ke perawat agar dimasukkan kembali ke antrian.</p>}
              {v.status === 'terdaftar' && v.antrian_status === 'menunggu' && <button className="btn btn-outline mt-4 min-h-[40px]" onClick={() => batal(v)}>Batalkan antrian</button>}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
