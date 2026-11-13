import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Pager, TableWrap, Th, Td, Empty, fmtTanggal } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Audit() {
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => {
    api(`/super-admin/audit-logs?${new URLSearchParams({ page: pg, ...(q && { q }) })}`).then(setPage).catch((e) => setErr(e.message))
  }, [pg, q])
  return (
    <div>
      <PageHeader title="Audit log" desc="Catatan login, logout, dan perubahan data penting. Log tidak dapat diubah dari aplikasi." />
      <input aria-label="Filter aksi" placeholder="Filter aksi, mis. login" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} className="mb-4 min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3 sm:w-72" />
      <Alert>{err}</Alert>
      {page && (page.data.length === 0 ? <Empty>Belum ada catatan aktivitas.</Empty> : (
        <TableWrap>
          <thead><tr><Th>Waktu</Th><Th>Pengguna</Th><Th>Aksi</Th><Th>Target</Th><Th>IP</Th></tr></thead>
          <tbody>{page.data.map((l) => (
            <tr key={l.id}><Td>{fmtTanggal(l.created_at)}</Td><Td>{l.user?.name ?? '-'}</Td><Td><code>{l.aksi}</code></Td><Td>{l.target ?? '-'}</Td><Td>{l.ip}</Td></tr>
          ))}</tbody>
        </TableWrap>
      ))}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}
