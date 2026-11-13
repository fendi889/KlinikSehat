import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { isoDay } from './ui.jsx'
import Icon from './Icon.jsx'
import { ClinicBuilding } from './Illustrations.jsx'

const info = [
  ['shield-check', 'Pelayanan', 'Terpercaya'], ['zap', 'Antrian Online', 'Real-Time'],
  ['heart', 'Dokter', 'Profesional'], ['headset', 'Pendaftaran', '24 Jam'],
]

function RegistrationCard() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [polis, setPolis] = useState(null)
  const [poli, setPoli] = useState('')
  const [tanggal, setTanggal] = useState(isoDay())
  const [err, setErr] = useState('')

  useEffect(() => { api('/public/polis').then(setPolis).catch(() => setPolis([])) }, [])

  const daftar = (e) => {
    e.preventDefault(); setErr('')
    if (!poli) return setErr('Pilih poliklinik terlebih dahulu.')
    if (!tanggal) return setErr('Pilih tanggal kunjungan.')
    const target = `/pasien/daftar?${new URLSearchParams({ poli, tanggal })}`
    if (!user) return nav(`/login?next=${encodeURIComponent(target)}`)
    if (user.role === 'pasien') return nav(target)
    setErr('Pendaftaran online khusus untuk akun pasien. Anda masuk sebagai ' + user.role_nama + '.')
  }

  return (
    <form onSubmit={daftar} noValidate className="card w-full max-w-sm animate-fade-up p-6" aria-label="Form pendaftaran nomor antrian">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-500"><Icon name="activity" /></span>
        <h2 className="text-lg font-extrabold">Daftar Nomor Antrian</h2>
      </div>
      <label htmlFor="h-poli" className="mb-1 block text-sm font-bold">Poliklinik</label>
      <div className="relative">
        <select id="h-poli" value={poli} onChange={(e) => setPoli(e.target.value)} disabled={polis === null}
          className="min-h-[46px] w-full appearance-none rounded-xl border border-brand-200 bg-white pl-3 pr-10 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200">
          <option value="">{polis === null ? 'Memuat poliklinik…' : '-- Pilih Poliklinik --'}</option>
          {(polis || []).map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
        </select>
        <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-700" />
      </div>
      <label htmlFor="h-tgl" className="mb-1 mt-4 block text-sm font-bold">Tanggal</label>
      <input id="h-tgl" type="date" value={tanggal} min={isoDay()} max={isoDay(13)} onChange={(e) => setTanggal(e.target.value)}
        className="min-h-[46px] w-full rounded-xl border border-brand-200 bg-white px-3 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
      {err && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{err}</p>}
      {polis && polis.length === 0 && <p className="mt-3 text-xs text-brand-700">Daftar poliklinik belum dapat dimuat. Pastikan server berjalan.</p>}
      <button className="btn btn-primary mt-5 w-full"><Icon name="send" className="h-4 w-4" />Daftar Sekarang</button>
      <p className="mt-3 text-center text-xs text-brand-700">Pilih dokter dan jam praktik pada langkah berikutnya.</p>
    </form>
  )
}

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50 to-brand-100">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-10 md:pt-16 lg:grid-cols-[1.05fr_1fr]">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-600 shadow-card"><span className="h-2 w-2 animate-ring rounded-full bg-sehat" />Antrian online aktif</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
            Daftar dari rumah, datang saat nomor Anda hampir <span className="text-brand-500">dipanggil.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-brand-700">
            Sistem antrian online KlinikSehat memudahkan Anda mendaftar dan memantau antrian secara real-time, dengan rekam medis digital yang aman.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/daftar" className="btn btn-primary px-6 py-3"><Icon name="calendar-plus" className="h-5 w-5" />Daftar Sekarang<Icon name="arrow-right" className="h-4 w-4" /></Link>
            <a href="#tentang" className="btn btn-outline px-6 py-3"><Icon name="info" className="h-5 w-5 text-brand-500" />Pelajari Lebih Lanjut</a>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-brand-700"><Icon name="clock" className="h-4 w-4" />Buka Senin–Sabtu 07.30–21.00 · Minggu 08.00–14.00</p>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <ClinicBuilding className="w-full drop-shadow-xl" />
          <div className="mt-4 sm:absolute sm:left-3 sm:top-1/2 sm:mt-0 sm:w-[18.5rem] sm:-translate-y-1/2"><RegistrationCard /></div>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 pb-12 pt-6 sm:mt-4 lg:grid-cols-4">
        {info.map(([ic, a, b], i) => (
          <div key={a} className="card card-hover flex animate-fade-up items-center gap-3 p-4" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-500"><Icon name={ic} className="h-6 w-6" /></span>
            <p className="text-sm font-bold leading-tight">{a}<br />{b}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
