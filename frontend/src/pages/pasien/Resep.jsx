import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, StatusBadge, Empty, tglPanjang } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Resep() {
  const [list, setList] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { api('/pasien/prescriptions').then(setList).catch((e) => setErr(e.message)) }, [])
  return (
    <div className="max-w-3xl">
      <PageHeader title="Resep obat" />
      <Alert>{err}</Alert>
      {!list ? <p className="text-brand-700">Memuat…</p> : list.length === 0 ? <Empty>Belum ada resep.</Empty> : (
        <div className="space-y-3">
          {list.map((rx) => (
            <article key={rx.id} className="rounded-xl border border-brand-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3"><p className="font-semibold">{tglPanjang(rx.medical_record?.visit?.tanggal)}</p><StatusBadge status={rx.status} /></div>
              <ul className="mt-2 ml-5 list-disc text-sm">{rx.items.map((i) => <li key={i.id}>{i.medicine.nama} · {i.jumlah} {i.medicine.satuan} · {i.aturan_pakai}</li>)}</ul>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
