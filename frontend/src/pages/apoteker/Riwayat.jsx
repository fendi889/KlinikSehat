import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Pager, TableWrap, Th, Td, Empty, DateRange, fmtTanggal, isoDay } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'
import ExportButton from './ExportButton.jsx'

const label = { masuk: 'Masuk', keluar: 'Keluar', koreksi: 'Koreksi' }

export default function Riwayat() {
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [from, setFrom] = useState(isoDay(-29))
  const [to, setTo] = useState(isoDay())
  const [jenis, setJenis] = useState('')
  const [err, setErr] = useState('')
  const qs = new URLSearchParams({ from, to, ...(jenis && { jenis }) }).toString()
  useEffect(() => { api(`/apoteker/movements?${qs}&page=${pg}`).then(setPage).catch((e) => setErr(e.message)) }, [qs, pg])
  return (
    <div className="max-w-5xl">
      <PageHeader title="Riwayat obat" desc="Seluruh pergerakan stok: masuk, keluar (termasuk resep), dan koreksi."
        action={<ExportButton jenis="riwayat" query={qs} onError={setErr} />} />
      <DateRange from={from} to={to} onChange={(a, b) => { setFrom(a); setTo(b); setPg(1) }} />
      <select aria-label="Filter jenis" className="mb-4 min-h-[44px] rounded-lg border border-brand-200 bg-white px-3" value={jenis} onChange={(e) => { setJenis(e.target.value); setPg(1) }}>
        <option value="">Semua jenis</option><option value="masuk">Masuk</option><option value="keluar">Keluar</option><option value="koreksi">Koreksi</option>
      </select>
      <Alert>{err}</Alert>
      {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Tidak ada pergerakan stok pada periode ini.</Empty> : (
        <TableWrap><thead><tr><Th>Waktu</Th><Th>Obat</Th><Th>Batch</Th><Th>Jenis</Th><Th>Jumlah</Th><Th>Keterangan</Th><Th>Petugas</Th></tr></thead>
          <tbody>{page.data.map((m) => (
            <tr key={m.id}><Td>{fmtTanggal(m.waktu)}</Td><Td>{m.obat}</Td><Td>{m.no_batch}</Td><Td>{label[m.jenis] || m.jenis}</Td>
              <Td className={`font-semibold ${m.jumlah < 0 ? 'text-red-600' : 'text-sehat'}`}>{m.jumlah > 0 ? '+' : ''}{m.jumlah}</Td><Td>{m.keterangan}</Td><Td>{m.petugas ?? '-'}</Td></tr>))}</tbody></TableWrap>
      )}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}
