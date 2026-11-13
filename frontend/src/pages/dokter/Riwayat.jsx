import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Pager, Empty, tglPanjang, fmtTanggal } from '../../components/ui.jsx'
import RecordView from '../../components/RecordView.jsx'
import { Alert } from '../auth/AuthShell.jsx'

function Detail({ id }) {
  const [d, setD] = useState(null)
  const [rev, setRev] = useState([])
  useEffect(() => { api(`/dokter/visits/${id}`).then(setD).catch(() => setD(false)); api(`/dokter/visits/${id}/revisions`).then(setRev).catch(() => {}) }, [id])
  if (d === false) return <Alert>Gagal memuat detail.</Alert>
  return d ? <div className="border-t border-brand-100 pt-3"><RecordView tanda_vital={d.tanda_vital} rekam_medis={d.rekam_medis} />
    {rev.length > 0 && <div className="mt-4 text-sm"><b>Riwayat perubahan rekam medis</b>
      <ul className="ml-5 list-disc">{rev.map((x, i) => <li key={i}>{fmtTanggal(x.waktu)} · {x.oleh} · mengubah: {Object.keys(x.perubahan.sesudah).filter((k) => JSON.stringify(x.perubahan.sebelum[k]) !== JSON.stringify(x.perubahan.sesudah[k])).join(', ')}</li>)}</ul></div>}</div> : <p className="text-brand-700">Memuat…</p>
}

export default function Riwayat() {
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [open, setOpen] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { api(`/dokter/history?page=${pg}`).then(setPage).catch((e) => setErr(e.message)) }, [pg])
  return (
    <div className="max-w-3xl">
      <PageHeader title="Riwayat pemeriksaan" desc="Pemeriksaan yang sudah Anda selesaikan." />
      <Alert>{err}</Alert>
      {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Belum ada pemeriksaan selesai.</Empty> : (
        <div className="space-y-3">{page.data.map((v) => (
          <article key={v.id} className="rounded-xl border border-brand-200 bg-white p-4">
            <button className="w-full text-left" aria-expanded={open === v.id} onClick={() => setOpen(open === v.id ? null : v.id)}>
              <span className="block font-semibold">{v.pasien} <span className="font-normal text-brand-700">· {v.no_rm}</span></span>
              <span className="text-sm text-brand-700">{tglPanjang(v.tanggal)} · {v.diagnosa.join(', ') || 'tanpa diagnosa'}</span>
            </button>
            {open === v.id && <div className="mt-3"><Detail id={v.id} /></div>}
          </article>))}</div>
      )}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}
