import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Pager, StatusBadge, Empty, rupiah, tglPanjang } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

function Detail({ id }) {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { api(`/pasien/visits/${id}`).then(setD).catch((e) => setErr(e.message)) }, [id])
  if (err) return <Alert>{err}</Alert>
  if (!d) return <p className="text-brand-700">Memuat…</p>
  const tv = d.tanda_vital, mr = d.rekam_medis
  return (
    <div className="space-y-4 border-t border-brand-100 pt-4 text-sm">
      {d.keluhan && <p><b>Keluhan:</b> {d.keluhan}</p>}
      {tv && <p><b>Tanda vital:</b> TD {tv.td_sistol}/{tv.td_diastol} mmHg · Nadi {tv.nadi}/mnt · Suhu {tv.suhu}°C · SpO₂ {tv.spo2}% · BB {tv.bb} kg · TB {tv.tb} cm</p>}
      {mr ? <>
        {mr.pemeriksaan_fisik && <p><b>Pemeriksaan:</b> {mr.pemeriksaan_fisik}</p>}
        <div><b>Diagnosa:</b> {mr.diagnoses.length ? <ul className="ml-5 list-disc">{mr.diagnoses.map((x) => <li key={x.id}>{x.kode_icd && `${x.kode_icd} · `}{x.nama}</li>)}</ul> : '-'}</div>
        {mr.procedures.length > 0 && <div><b>Tindakan:</b> <ul className="ml-5 list-disc">{mr.procedures.map((x) => <li key={x.id}>{x.nama}</li>)}</ul></div>}
        {mr.prescriptions.map((rx) => (
          <div key={rx.id}><b>Resep:</b> <StatusBadge status={rx.status} />
            <ul className="ml-5 list-disc">{rx.items.map((i) => <li key={i.id}>{i.medicine.nama} · {i.jumlah} {i.medicine.satuan} · {i.aturan_pakai}</li>)}</ul></div>
        ))}
        {mr.catatan_dokter && <p><b>Catatan dokter:</b> {mr.catatan_dokter}</p>}
      </> : <p className="text-brand-700">Hasil pemeriksaan belum tersedia.</p>}
      {d.invoice && <p><b>Tagihan {d.invoice.nomor}:</b> {rupiah(d.invoice.total)} <StatusBadge status={d.invoice.status} /></p>}
    </div>
  )
}

export default function Riwayat() {
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [open, setOpen] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { api(`/pasien/visits?page=${pg}`).then(setPage).catch((e) => setErr(e.message)) }, [pg])
  return (
    <div className="max-w-3xl">
      <PageHeader title="Riwayat dan hasil pemeriksaan" desc="Rekam medis Anda hanya dapat dilihat oleh Anda dan tenaga medis yang menangani." />
      <Alert>{err}</Alert>
      {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Belum ada riwayat kunjungan.</Empty> : (
        <div className="space-y-3">
          {page.data.map((v) => (
            <article key={v.id} className="rounded-xl border border-brand-200 bg-white p-4">
              <button className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open === v.id} onClick={() => setOpen(open === v.id ? null : v.id)}>
                <span><span className="block font-semibold">{tglPanjang(v.tanggal)}</span><span className="text-sm text-brand-700">{v.poli_nama} · {v.doctor_nama}</span></span>
                <StatusBadge status={v.status} />
              </button>
              {open === v.id && <div className="mt-3"><Detail id={v.id} /></div>}
            </article>
          ))}
        </div>
      )}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}
