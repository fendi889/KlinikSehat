import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Pager, StatusBadge, Empty, tglPanjang } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Resep() {
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [err, setErr] = useState('')
  useEffect(() => { api(`/dokter/prescriptions?page=${pg}`).then(setPage).catch((e) => setErr(e.message)) }, [pg])
  return (
    <div className="max-w-3xl">
      <PageHeader title="Resep yang saya tulis" desc="Resep dibuat di halaman pemeriksaan. Status berubah saat apoteker memproses." />
      <Alert>{err}</Alert>
      {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Belum ada resep.</Empty> : (
        <div className="space-y-3">{page.data.map((rx) => (
          <article key={rx.id} className="rounded-xl border border-brand-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3"><p className="font-semibold">{rx.medical_record?.patient?.nama} <span className="font-normal text-brand-700">· {tglPanjang(rx.medical_record?.visit?.tanggal)}</span></p><StatusBadge status={rx.status} /></div>
            <ul className="mt-2 ml-5 list-disc text-sm">{rx.items.map((i) => <li key={i.id}>{i.medicine.nama} · {i.jumlah} {i.medicine.satuan} · {i.aturan_pakai}</li>)}</ul>
          </article>))}</div>
      )}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}
