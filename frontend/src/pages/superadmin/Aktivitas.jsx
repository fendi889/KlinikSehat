import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, TableWrap, Th, Td, fmtTanggal } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

const label = { users: 'Akun', patients: 'Pasien', doctors: 'Dokter', visits: 'Kunjungan', medical_records: 'Rekam medis', invoices: 'Invoice', medicines: 'Jenis obat' }

export default function Aktivitas() {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    const load = () => api('/super-admin/activity').then(setD).catch((e) => setErr(e.message))
    load(); const t = setInterval(load, 15000); return () => clearInterval(t)
  }, [])
  return (
    <div>
      <PageHeader title="Monitoring aktivitas" desc="Statistik keseluruhan sistem. Diperbarui otomatis tiap 15 detik." />
      <Alert>{err}</Alert>
      {d && <>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Object.entries(d.totals).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-brand-200 bg-white p-4"><dt className="text-sm text-brand-700">{label[k]}</dt><dd className="font-display text-2xl font-bold">{v}</dd></div>
          ))}
          <div className="rounded-xl border border-brand-200 bg-white p-4"><dt className="text-sm text-brand-700">Sesi aktif</dt><dd className="font-display text-2xl font-bold">{d.sesi_aktif}</dd></div>
          <div className="rounded-xl border border-brand-200 bg-white p-4"><dt className="text-sm text-brand-700">Login 24 jam</dt><dd className="font-display text-2xl font-bold">{d.login_24_jam}</dd></div>
        </dl>
        <h2 className="mb-3 mt-8 font-semibold">Akun per role</h2>
        <TableWrap><thead><tr><Th>Role</Th><Th>Jumlah</Th></tr></thead>
          <tbody>{d.users_by_role.map((r) => <tr key={r.nama}><Td>{r.nama}</Td><Td>{r.jumlah}</Td></tr>)}</tbody></TableWrap>
        <h2 className="mb-3 mt-8 font-semibold">10 aktivitas terbaru</h2>
        <TableWrap><thead><tr><Th>Waktu</Th><Th>Pengguna</Th><Th>Aksi</Th></tr></thead>
          <tbody>{d.terbaru.map((l) => <tr key={l.id}><Td>{fmtTanggal(l.created_at)}</Td><Td>{l.user?.name ?? '-'}</Td><Td><code>{l.aksi}</code></Td></tr>)}</tbody></TableWrap>
      </>}
    </div>
  )
}
