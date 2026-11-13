import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, DateRange, TableWrap, Th, Td, rupiah, isoDay } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Kinerja() {
  const [from, setFrom] = useState(isoDay(-29))
  const [to, setTo] = useState(isoDay())
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { setErr(''); api(`/pemilik/performance?from=${from}&to=${to}`).then(setD).catch((e) => setErr(e.message)) }, [from, to])

  const tabel = (judul, rows, kolomPoli) => (
    <div className="mt-6">
      <h2 className="mb-3 font-semibold">{judul}</h2>
      <TableWrap>
        <thead><tr><Th>Nama</Th>{kolomPoli && <Th>Poli</Th>}<Th>Kunjungan</Th><Th>Selesai</Th><Th>Pendapatan</Th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}><Td>{r.nama}</Td>{kolomPoli && <Td>{r.poli}</Td>}<Td>{r.kunjungan}</Td><Td>{r.selesai}</Td><Td>{rupiah(r.pendapatan)}</Td></tr>
        ))}</tbody>
      </TableWrap>
    </div>
  )
  return (
    <div>
      <PageHeader title="Kinerja dokter dan poli" desc="Jumlah kunjungan dan pendapatan dari invoice lunas pada periode terpilih." />
      <DateRange from={from} to={to} onChange={(a, b) => { setFrom(a); setTo(b) }} />
      <Alert>{err}</Alert>
      {d && <>{tabel('Kinerja dokter', d.dokter, true)}{tabel('Kinerja poli', d.poli, false)}</>}
    </div>
  )
}
