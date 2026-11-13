import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Pager, Empty, TableWrap, Th, Td, tglPanjang } from '../../components/ui.jsx'
import RecordView from '../../components/RecordView.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function RekamMedis() {
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { api(`/dokter/patients?${new URLSearchParams({ page: pg, ...(q && { q }) })}`).then(setPage).catch((e) => setErr(e.message)) }, [pg, q])
  const buka = (p) => { setErr(''); api(`/dokter/patients/${p.id}/history`).then(setSel).catch((e) => setErr(e.message)) }

  if (sel) {
    return (
      <div className="max-w-3xl">
        <button className="btn btn-outline mb-4 min-h-[40px]" onClick={() => setSel(null)}>← Daftar pasien</button>
        <PageHeader title={sel.pasien.nama} desc={`${sel.pasien.no_rm} · ${sel.pasien.umur ?? '-'} th · Gol. darah ${sel.pasien.golongan_darah || '-'}`} />
        {sel.pasien.alergi && <p role="alert" className="mb-4 rounded-lg bg-yellow-50 p-3 font-semibold text-yellow-800">Alergi: {sel.pasien.alergi}</p>}
        <Alert>{err}</Alert>
        {sel.kunjungan.length === 0 ? <Empty>Belum ada kunjungan selesai.</Empty> : sel.kunjungan.map((k) => (
          <article key={k.id} className="mb-3 rounded-xl border border-brand-200 bg-white p-4">
            <p className="mb-2 font-semibold">{tglPanjang(k.tanggal)} <span className="font-normal text-brand-700">· {k.dokter}</span></p>
            <RecordView tanda_vital={k.tanda_vital} rekam_medis={k.rekam_medis} />
          </article>))}
      </div>
    )
  }
  return (
    <div className="max-w-4xl">
      <PageHeader title="Rekam medis" desc="Pasien yang pernah Anda periksa. Setiap akses riwayat pasien dibatasi ke pasien Anda." />
      <input aria-label="Cari pasien" placeholder="Cari nama atau No. RM" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} className="mb-4 min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3 sm:w-72" />
      <Alert>{err}</Alert>
      {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Tidak ada pasien.</Empty> : (
        <TableWrap><thead><tr><Th>Pasien</Th><Th>No. RM</Th><Th>Umur</Th><Th>Kunjungan terakhir</Th><Th>Aksi</Th></tr></thead>
          <tbody>{page.data.map((p) => (
            <tr key={p.id}><Td>{p.nama}{p.alergi && <span className="ml-2 text-xs text-yellow-800">alergi</span>}</Td><Td>{p.no_rm}</Td><Td>{p.umur ?? '-'}</Td><Td>{p.terakhir ? tglPanjang(p.terakhir) : '-'}</Td>
              <Td><button className="font-semibold text-brand-500" onClick={() => buka(p)}>Buka rekam medis</button></Td></tr>))}</tbody></TableWrap>
      )}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}
