import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, TableWrap, Th, Td } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Role() {
  const [roles, setRoles] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { api('/super-admin/roles').then(setRoles).catch((e) => setErr(e.message)) }, [])
  return (
    <div>
      <PageHeader title="Manajemen role" desc="Ketujuh role bersifat tetap karena terhubung ke dashboard dan hak akses API. Ubah hak akses di menu Permission." />
      <Alert>{err}</Alert>
      {roles && (
        <TableWrap>
          <thead><tr><Th>Role</Th><Th>Kode</Th><Th>Jumlah akun</Th><Th>Jumlah permission</Th></tr></thead>
          <tbody>{roles.map((r) => (
            <tr key={r.id}><Td>{r.nama}</Td><Td><code>{r.slug}</code></Td><Td>{r.users_count}</Td><Td>{r.permissions.length}</Td></tr>
          ))}</tbody>
        </TableWrap>
      )}
    </div>
  )
}
