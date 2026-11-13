import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'

// Layar antrian publik (tanpa login, tanpa nama pasien). Cocok ditampilkan di TV ruang tunggu.
export default function AntrianPublik() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(false)
  const [jam, setJam] = useState(new Date())
  useEffect(() => {
    const load = () => api('/public/queue-board').then((r) => { setData(r); setErr(false) }).catch(() => setErr(true))
    load(); const t = setInterval(load, 5000); const c = setInterval(() => setJam(new Date()), 1000)
    return () => { clearInterval(t); clearInterval(c) }
  }, [])
  return (
    <main className="min-h-screen bg-brand-900 p-4 text-white md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold md:text-5xl">Antrian KlinikSehat</h1>
        <p className="text-xl md:text-3xl" aria-live="off">{jam.toLocaleTimeString('id-ID')}</p>
      </header>
      {err && <p role="alert" className="mb-4 rounded-lg bg-red-600 p-3">Koneksi terputus. Mencoba menyambung kembali…</p>}
      {!data ? <p>Memuat…</p> : data.length === 0 ? <p className="text-xl">Belum ada poli aktif.</p> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" role="status" aria-live="polite">
          {data.map((p) => (
            <section key={p.poli} className="rounded-2xl bg-white p-6 text-brand-900">
              <h2 className="text-xl font-semibold md:text-2xl">{p.poli}</h2>
              <p className="mt-3 text-sm text-brand-700">Sedang dipanggil</p>
              <p className={`font-display text-6xl font-bold md:text-7xl ${p.sekarang ? 'text-brand-500' : 'text-brand-200'}`}>{p.sekarang || '—'}</p>
              <p className="mt-4 text-sm text-brand-700">Berikutnya ({p.menunggu} menunggu)</p>
              <p className="text-2xl font-semibold">{p.berikutnya.length ? p.berikutnya.join('  ·  ') : '—'}</p>
            </section>
          ))}
        </div>
      )}
      <p className="mt-8 text-center text-sm text-brand-200">Diperbarui otomatis. <Link to="/" className="underline">Beranda</Link></p>
    </main>
  )
}
