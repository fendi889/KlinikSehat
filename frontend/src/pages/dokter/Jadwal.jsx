import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, TableWrap, Th, Td, Empty } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Jadwal() {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { api('/dokter/schedule').then(setRows).catch((e) => setErr(e.message)) }, [])
  const hariIni = ((new Date().getDay() + 6) % 7) + 1
  return (
    <div className="max-w-3xl">
      <PageHeader title="Jadwal praktik saya" desc="Jadwal diatur oleh admin klinik." />
      <Alert>{err}</Alert>
      {rows && (rows.length === 0 ? <Empty>Belum ada jadwal praktik.</Empty> : (
        <TableWrap><thead><tr><Th>Hari</Th><Th>Jam</Th><Th>Kuota</Th><Th>Status</Th></tr></thead>
          <tbody>{rows.map((s) => (
            <tr key={s.id} className={s.hari === hariIni ? 'bg-brand-100' : ''}>
              <Td>{s.hari_nama}{s.hari === hariIni && <b> (hari ini)</b>}</Td><Td>{s.jam_mulai}–{s.jam_selesai}</Td><Td>{s.kuota}</Td><Td>{s.aktif ? 'Aktif' : 'Nonaktif'}</Td>
            </tr>))}</tbody></TableWrap>
      ))}
    </div>
  )
}
