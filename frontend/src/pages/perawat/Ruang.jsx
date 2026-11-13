import { useEffect, useState, useCallback } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Empty, fmtTanggal } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

const inp = 'min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3'

export default function Ruang() {
  const [rooms, setRooms] = useState(null)
  const [aktif, setAktif] = useState([])
  const [tasks, setTasks] = useState(null)
  const [pilih, setPilih] = useState({})
  const [cari, setCari] = useState('')
  const [hasil, setHasil] = useState([])
  const [t, setT] = useState({ patient: null, nama: '', jadwal_at: '', catatan: '' })
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const load = useCallback(() => {
    api('/perawat/rooms').then(setRooms).catch((e) => setErr(e.message))
    api('/perawat/queue').then((r) => setAktif(r.antrian.filter((q) => !['selesai', 'batal'].includes(q.visit_status)))).catch(() => {})
    api('/perawat/tasks').then(setTasks).catch((e) => setErr(e.message))
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (cari.trim().length < 2) { setHasil([]); return }
    const h = setTimeout(() => api(`/perawat/patients?q=${encodeURIComponent(cari)}`).then(setHasil).catch(() => {}), 300)
    return () => clearTimeout(h)
  }, [cari])

  const aksi = async (fn, pesan) => { setErr(''); setOk(''); try { await fn(); if (pesan) setOk(pesan); load() } catch (e) { setErr(e.message + (e.errors && Object.values(e.errors)[0] ? ` (${Object.values(e.errors)[0][0]})` : '')) } }
  const tempatkan = (room, visitId) => aksi(() => api(`/perawat/visits/${visitId}/room`, { method: 'PUT', body: { room_id: room } }))
  const buat = (e) => { e.preventDefault(); aksi(async () => { await api('/perawat/tasks', { method: 'POST', body: { patient_id: t.patient.id, nama: t.nama, jadwal_at: t.jadwal_at, catatan: t.catatan || null } }); setT({ patient: null, nama: '', jadwal_at: '', catatan: '' }); setCari('') }, 'Jadwal tindakan dibuat.') }
  const status = (task, s) => aksi(() => api(`/perawat/tasks/${task.id}/status`, { method: 'PUT', body: { status: s } }), s === 'selesai' ? 'Tindakan ditandai selesai.' : 'Tindakan dibatalkan.')
  const bebas = aktif.filter((q) => !q.room_id)

  return (
    <div className="max-w-4xl">
      <PageHeader title="Ruang pemeriksaan dan jadwal tindakan" />
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>

      <h2 className="mb-3 font-semibold">Ruang</h2>
      {!rooms ? <p className="text-brand-700">Memuat…</p> : rooms.length === 0 ? <Empty>Belum ada ruang. Admin menambahkannya di menu Ruang periksa.</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2">{rooms.map((r) => (
          <div key={r.id} className={`rounded-xl border p-4 ${r.terpakai ? 'border-brand-500 bg-brand-100' : 'border-brand-200 bg-white'}`}>
            <p className="font-semibold">{r.nama}</p>
            {r.terpakai ? <>
              <p className="text-sm">{r.terpakai.kode} · {r.terpakai.pasien}</p>
              <button className="mt-2 font-semibold text-red-600" onClick={() => tempatkan(null, r.terpakai.visit_id)}>Kosongkan</button>
            </> : <>
              <p className="text-sm text-sehat font-semibold">Kosong</p>
              <select aria-label={`Tempatkan pasien di ${r.nama}`} className={`${inp} mt-2`} value="" onChange={(e) => e.target.value && tempatkan(r.id, e.target.value)}>
                <option value="">Tempatkan pasien…</option>{bebas.map((q) => <option key={q.visit_id} value={q.visit_id}>{q.kode} · {q.pasien}</option>)}
              </select>
            </>}
          </div>))}</div>
      )}

      <h2 className="mb-3 mt-10 font-semibold">Jadwal tindakan</h2>
      <form onSubmit={buat} className="mb-4 grid gap-3 rounded-xl border border-brand-200 bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          {t.patient ? <p className="flex justify-between"><span><b>{t.patient.nama}</b> · {t.patient.no_rm}</span><button type="button" className="font-semibold text-brand-500" onClick={() => setT({ ...t, patient: null })}>Ganti</button></p> : <>
            <input aria-label="Cari pasien" placeholder="Cari pasien (nama / No. RM)" className={inp} value={cari} onChange={(e) => setCari(e.target.value)} />
            {hasil.length > 0 && <ul className="mt-2 rounded-lg border border-brand-200">{hasil.map((p) => <li key={p.id}><button type="button" className="w-full p-3 text-left hover:bg-brand-50" onClick={() => { setT({ ...t, patient: p }); setHasil([]) }}>{p.nama} · {p.no_rm}</button></li>)}</ul>}</>}
        </div>
        <input aria-label="Nama tindakan" placeholder="Nama tindakan (mis. Ganti perban)" className={inp} value={t.nama} onChange={(e) => setT({ ...t, nama: e.target.value })} />
        <input aria-label="Waktu tindakan" type="datetime-local" className={inp} value={t.jadwal_at} onChange={(e) => setT({ ...t, jadwal_at: e.target.value })} />
        <input aria-label="Catatan" placeholder="Catatan (opsional)" className={`${inp} md:col-span-2`} value={t.catatan} onChange={(e) => setT({ ...t, catatan: e.target.value })} />
        <div className="md:col-span-2"><button className="btn btn-primary" disabled={!t.patient || !t.nama || !t.jadwal_at}>Jadwalkan</button></div>
      </form>
      {!tasks ? <p className="text-brand-700">Memuat…</p> : tasks.length === 0 ? <Empty>Tidak ada tindakan terjadwal.</Empty> : (
        <ul className="space-y-2">{tasks.map((k) => (
          <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-white p-4">
            <span><b>{k.nama}</b><br /><span className="text-sm text-brand-700">{k.patient?.nama} · {fmtTanggal(k.jadwal_at)}{k.catatan && ` · ${k.catatan}`}</span></span>
            <span className="space-x-3"><button className="font-semibold text-brand-500" onClick={() => status(k, 'selesai')}>Selesai</button><button className="font-semibold text-red-600" onClick={() => status(k, 'batal')}>Batal</button></span>
          </li>))}</ul>
      )}
    </div>
  )
}
