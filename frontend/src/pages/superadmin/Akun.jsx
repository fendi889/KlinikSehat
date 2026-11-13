import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { PageHeader, Pager, TableWrap, Th, Td, Empty } from '../../components/ui.jsx'
import { Field, Alert } from '../auth/AuthShell.jsx'

const blank = { name: '', email: '', phone: '', role_id: '', poli_id: '', password: '' }

export default function Akun() {
  const { user: me } = useAuth()
  const [page, setPage] = useState(null)
  const [roles, setRoles] = useState([])
  const [polis, setPolis] = useState([])
  const [q, setQ] = useState('')
  const [roleId, setRoleId] = useState('')
  const [pg, setPg] = useState(1)
  const [err, setErr] = useState('')
  const [form, setForm] = useState(null) // null = tertutup; {id?} = tambah/ubah
  const [fe, setFe] = useState({})
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page: pg, ...(q && { q }), ...(roleId && { role_id: roleId }) })
    api(`/super-admin/users?${qs}`).then(setPage).catch((e) => setErr(e.message))
  }, [pg, q, roleId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    api('/super-admin/roles').then(setRoles).catch(() => {})
    api('/public/polis').then(setPolis).catch(() => {})
  }, [])

  const roleSlug = (id) => roles.find((r) => String(r.id) === String(id))?.slug
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setFe({}); setErr('')
    try {
      if (form.id) {
        await api(`/super-admin/users/${form.id}`, { method: 'PUT', body: { name: form.name, email: form.email, phone: form.phone, is_active: form.is_active, password: form.password || null } })
      } else {
        await api('/super-admin/users', { method: 'POST', body: { ...form, poli_id: form.poli_id || null } })
      }
      setForm(null); load()
    } catch (x) {
      setErr(x.message); setFe(Object.fromEntries(Object.entries(x.errors || {}).map(([k, v]) => [k, v[0]])))
    } finally { setBusy(false) }
  }

  const toggle = async (u) => {
    try { await api(`/super-admin/users/${u.id}`, { method: 'PUT', body: { name: u.name, email: u.email, phone: u.phone, is_active: !u.is_active } }); load() }
    catch (x) { setErr(x.message) }
  }
  const remove = async (u) => {
    if (!window.confirm(`Hapus akun ${u.email}?`)) return
    try { await api(`/super-admin/users/${u.id}`, { method: 'DELETE' }); load() } catch (x) { setErr(x.message) }
  }

  return (
    <div>
      <PageHeader title="Manajemen akun" desc="Tambah, ubah, nonaktifkan, atau hapus akun semua role."
        action={<button className="btn btn-primary" onClick={() => { setForm({ ...blank }); setFe({}); setErr('') }}>Tambah akun</button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <input aria-label="Cari nama atau email" placeholder="Cari nama atau email" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} className="min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3 sm:w-72" />
        <select aria-label="Filter role" value={roleId} onChange={(e) => { setRoleId(e.target.value); setPg(1) }} className="min-h-[44px] rounded-lg border border-brand-200 bg-white px-3">
          <option value="">Semua role</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
        </select>
      </div>
      <Alert>{err}</Alert>

      {form && (
        <form onSubmit={save} className="mb-6 grid gap-4 rounded-xl border border-brand-200 bg-white p-5 md:grid-cols-2" noValidate>
          <h2 className="font-semibold md:col-span-2">{form.id ? 'Ubah akun' : 'Akun baru'}</h2>
          <Field label="Nama" name="name" value={form.name} onChange={set} error={fe.name} />
          <Field label="Email" name="email" type="email" value={form.email} onChange={set} error={fe.email} />
          <Field label="Nomor HP" name="phone" value={form.phone || ''} onChange={set} error={fe.phone} />
          {!form.id && (
            <div>
              <label htmlFor="role_id" className="mb-1 block text-sm font-semibold">Role</label>
              <select id="role_id" name="role_id" value={form.role_id} onChange={set} className="min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3">
                <option value="">Pilih role</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
              </select>
              {fe.role_id && <p className="mt-1 text-sm text-red-600">{fe.role_id}</p>}
            </div>
          )}
          {!form.id && roleSlug(form.role_id) === 'dokter' && (
            <div>
              <label htmlFor="poli_id" className="mb-1 block text-sm font-semibold">Poli dokter</label>
              <select id="poli_id" name="poli_id" value={form.poli_id} onChange={set} className="min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3">
                <option value="">Pilih poli</option>
                {polis.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
            </div>
          )}
          <Field label={form.id ? 'Password baru (kosongkan jika tidak diubah)' : 'Password (min. 8 karakter)'} name="password" type="password" value={form.password} onChange={set} error={fe.password} autoComplete="new-password" />
          <div className="flex gap-3 md:col-span-2">
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Batal</button>
          </div>
        </form>
      )}

      {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Tidak ada akun yang cocok dengan pencarian.</Empty> : (
        <TableWrap>
          <thead><tr><Th>Nama</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Aksi</Th></tr></thead>
          <tbody>
            {page.data.map((u) => (
              <tr key={u.id}>
                <Td>{u.name}</Td><Td>{u.email}</Td><Td>{u.role?.nama}</Td>
                <Td><span className={u.is_active ? 'text-sehat font-semibold' : 'text-red-600 font-semibold'}>{u.is_active ? 'Aktif' : 'Nonaktif'}</span></Td>
                <Td className="space-x-3 whitespace-nowrap">
                  <button className="font-semibold text-brand-500" onClick={() => { setForm({ ...u, password: '' }); setFe({}); setErr('') }}>Ubah</button>
                  {u.id !== me.id && <>
                    <button className="font-semibold text-brand-500" onClick={() => toggle(u)}>{u.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                    <button className="font-semibold text-red-600" onClick={() => remove(u)}>Hapus</button>
                  </>}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}
