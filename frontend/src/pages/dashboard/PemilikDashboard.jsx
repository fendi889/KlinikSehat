import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { StatTile, rupiah } from '../../components/ui.jsx'
import { LineChart } from '../../components/charts.jsx'
import Icon from '../../components/Icon.jsx'

const RENTANG = [['30h', '30 Hari'], ['6b', '6 Bulan'], ['12b', '12 Bulan']]
const PINTASAN = [['keuangan', 'wallet', 'Keuangan'], ['kinerja', 'trending-up', 'Kinerja'], ['monitoring', 'monitor', 'Monitoring'], ['laporan', 'bar-chart', 'Laporan']]

export default function PemilikDashboard() {
  const { user } = useAuth()
  const [d, setD] = useState(null)
  const [board, setBoard] = useState(null)
  const [rentang, setRentang] = useState('12b')
  const [err, setErr] = useState('')

  useEffect(() => { api('/pemilik/overview').then(setD).catch((e) => setErr(e.message)) }, [])
  useEffect(() => {
    const load = () => api('/public/queue-board').then(setBoard).catch(() => {})
    load(); const t = setInterval(load, 5000); return () => clearInterval(t)
  }, [])

  const data = !d ? [] : rentang === '30h'
    ? d.kunjungan_harian.map((x) => ({ label: x.label, value: x.jumlah }))
    : d.kunjungan_bulanan.slice(rentang === '6b' ? -6 : 0).map((x) => ({ label: x.label, value: x.jumlah }))
  const aktif = board?.find((p) => p.sekarang) || null
  const menunggu = board ? board.reduce((a, p) => a + p.menunggu, 0) : 0

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-500"><Icon name="home" className="h-6 w-6" /></span>
        <div><h1 className="text-2xl font-extrabold md:text-3xl">Dashboard</h1><p className="text-brand-700">Selamat datang di KlinikSehat, {user.name}</p></div>
      </div>
      {err && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{err}</p>}

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon="users" tone="blue" label="Total Pasien" value={d ? d.pasien.total.toLocaleString('id-ID') : '…'} trend={d ? d.pasien.trend : undefined} />
        <StatTile icon="stethoscope" tone="green" label="Total Dokter" value={d ? d.dokter.total.toLocaleString('id-ID') : '…'} />
        <StatTile icon="list" tone="purple" label="Antrian Hari Ini" value={d ? d.antrian.hari_ini.toLocaleString('id-ID') : '…'} trend={d ? d.antrian.trend : undefined} />
        <StatTile icon="wallet" tone="orange" label="Pendapatan Bulan Ini" value={d ? rupiah(d.pendapatan.bulan_ini) : '…'} trend={d ? d.pendapatan.trend : undefined} />
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section className="card p-5" aria-labelledby="g-kunjungan">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="g-kunjungan" className="font-extrabold">Grafik Kunjungan Pasien</h2>
            <div className="flex gap-1 rounded-xl bg-brand-50 p-1" role="group" aria-label="Rentang grafik">
              {RENTANG.map(([k, l]) => (
                <button key={k} onClick={() => setRentang(k)} aria-pressed={rentang === k} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${rentang === k ? 'bg-white text-brand-600 shadow-card' : 'text-brand-700 hover:text-brand-500'}`}>{l}</button>
              ))}
            </div>
          </div>
          {d ? <LineChart label="Grafik kunjungan pasien" data={data} /> : <p className="py-16 text-center text-brand-700">Memuat grafik…</p>}
        </section>

        <section className="card flex flex-col p-5" aria-labelledby="g-antrian">
          <h2 id="g-antrian" className="font-extrabold">Antrian Saat Ini</h2>
          <div className="mt-3 rounded-2xl bg-brand-50 p-5 text-center" role="status">
            {aktif ? <>
              <p className="text-5xl font-extrabold text-brand-500">{aktif.sekarang}</p>
              <p className="mt-1 font-bold">{aktif.poli}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-brand-700"><Icon name="clock" className="h-4 w-4" />{aktif.menunggu > 0 ? `${aktif.menunggu} pasien menunggu` : 'Tidak ada yang menunggu'}</p>
            </> : <>
              <p className="text-4xl font-extrabold text-brand-200">—</p>
              <p className="mt-1 font-bold">Belum ada panggilan</p>
              <p className="mt-1 text-sm text-brand-700">{menunggu} pasien menunggu hari ini</p>
            </>}
          </div>
          {board && board.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">
              {board.slice(0, 5).map((p) => <li key={p.poli} className="flex items-center justify-between"><span className="text-brand-700">{p.poli}</span><b>{p.sekarang || '—'}</b></li>)}
            </ul>
          )}
          <Link to="/antrian" className="btn btn-primary mt-5 w-full">Lihat Semua Antrian<Icon name="arrow-right" className="h-4 w-4" /></Link>
        </section>
      </div>

      <h2 className="mb-3 mt-8 font-extrabold">Pintasan</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {PINTASAN.map(([slug, ic, t]) => (
          <Link key={slug} to={`/pemilik/${slug}`} className="card card-hover flex items-center gap-3 p-4 font-bold">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-500"><Icon name={ic} /></span>{t}
          </Link>
        ))}
      </div>
    </div>
  )
}
