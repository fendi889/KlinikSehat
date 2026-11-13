import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, TableWrap, Th, Td } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Permission() {
  const [roles, setRoles] = useState(null)
  const [perms, setPerms] = useState([])
  const [sel, setSel] = useState({}) // { roleId: Set(permissionId) }
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    Promise.all([api('/super-admin/roles'), api('/super-admin/permissions')]).then(([r, p]) => {
      setRoles(r); setPerms(p)
      setSel(Object.fromEntries(r.map((x) => [x.id, new Set(x.permissions.map((y) => y.id))])))
    }).catch((e) => setErr(e.message))
  }, [])

  const flip = (rid, pid) => setSel((s) => {
    const n = new Set(s[rid]); n.has(pid) ? n.delete(pid) : n.add(pid); return { ...s, [rid]: n }
  })

  const save = async (role) => {
    setErr(''); setOk('')
    try {
      await api(`/super-admin/roles/${role.id}/permissions`, { method: 'PUT', body: { permission_ids: [...sel[role.id]] } })
      setOk(`Permission ${role.nama} disimpan.`)
    } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <PageHeader title="Manajemen permission" desc="Centang hak akses tiap role, lalu simpan per kolom. Super Admin selalu memiliki semua permission." />
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      {roles && (
        <div className="mt-4"><TableWrap>
          <thead><tr><Th>Permission</Th>{roles.map((r) => <Th key={r.id}>{r.nama}</Th>)}</tr></thead>
          <tbody>
            {perms.map((p) => (
              <tr key={p.id}>
                <Td>{p.nama}<span className="block text-xs text-brand-700">{p.slug}</span></Td>
                {roles.map((r) => (
                  <Td key={r.id}>
                    <input type="checkbox" className="h-5 w-5" aria-label={`${p.nama} untuk ${r.nama}`}
                      checked={sel[r.id]?.has(p.id) || false} disabled={r.slug === 'super_admin'} onChange={() => flip(r.id, p.id)} />
                  </Td>
                ))}
              </tr>
            ))}
            <tr>
              <Td>Simpan perubahan</Td>
              {roles.map((r) => <Td key={r.id}>{r.slug !== 'super_admin' && <button className="font-semibold text-brand-500" onClick={() => save(r)}>Simpan</button>}</Td>)}
            </tr>
          </tbody>
        </TableWrap></div>
      )}
    </div>
  )
}
