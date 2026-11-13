import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader } from '../../components/ui.jsx'
import { BarChart } from '../../components/charts.jsx'
import { rupiah } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Grafik() {
  const [days, setDays] = useState(30)
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { setErr(''); api(`/pemilik/charts?days=${days}`).then(setD).catch((e) => setErr(e.message)) }, [days])
  return (
    <div>
      <PageHeader title="Grafik kunjungan dan pendapatan" />
      <Alert>{err}</Alert>
      <div className="mb-4 flex gap-2" role="group" aria-label="Rentang hari">
        {[7, 30, 90].map((n) => (
          <button key={n} onClick={() => setDays(n)} aria-pressed={days === n} className={`btn min-h-[40px] px-4 ${days === n ? 'btn-primary' : 'btn-outline bg-white'}`}>{n} hari</button>
        ))}
      </div>
      {d && <>
        <div className="rounded-xl border border-brand-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Kunjungan per hari ({days} hari terakhir)</h2>
          <BarChart label="Kunjungan per hari" data={d.kunjungan_harian.map((x) => ({ label: x.label, value: x.jumlah }))} />
          <p className="mt-2 text-sm text-brand-700">Total {d.kunjungan_harian.reduce((a, x) => a + x.jumlah, 0)} kunjungan.</p>
        </div>
        <div className="mt-6 rounded-xl border border-brand-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Pendapatan per bulan</h2>
          <BarChart label="Pendapatan per bulan" color="#10b5a0" fmt={rupiah} data={d.bulanan.map((x) => ({ label: x.label, value: x.pendapatan }))} />
        </div>
      </>}
    </div>
  )
}
