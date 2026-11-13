import { api } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { Field, Alert, useForm } from './AuthShell.jsx'

export function Profile() {
  const { user, setUser } = useAuth()
  const f = useForm({ name: user.name, phone: user.phone || '' }, async (v, setOk) => {
    const r = await api('/auth/profile', { method: 'PUT', body: v }); setUser(r.user); setOk(r.message)
  })
  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold">Profil saya</h1>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-brand-700">Email</dt><dd>{user.email}</dd>
        <dt className="text-brand-700">Role</dt><dd>{user.role_nama}</dd>
      </dl>
      <form onSubmit={f.onSubmit} className="mt-6 space-y-4 rounded-xl border border-brand-200 bg-white p-5" noValidate>
        <Alert>{f.message}</Alert><Alert kind="ok">{f.ok}</Alert>
        <Field label="Nama lengkap" name="name" value={f.values.name} onChange={f.onChange} error={f.errors.name} />
        <Field label="Nomor HP" name="phone" type="tel" value={f.values.phone} onChange={f.onChange} error={f.errors.phone} />
        <button className="btn btn-primary" disabled={f.busy}>{f.busy ? 'Menyimpan…' : 'Simpan profil'}</button>
      </form>
    </div>
  )
}

export function ChangePassword() {
  const f = useForm({ current_password: '', password: '', password_confirmation: '' }, async (v, setOk) => {
    const r = await api('/auth/password', { method: 'PUT', body: v }); setOk(r.message)
  })
  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold">Ubah password</h1>
      <form onSubmit={f.onSubmit} className="mt-6 space-y-4 rounded-xl border border-brand-200 bg-white p-5" noValidate>
        <Alert>{f.message}</Alert><Alert kind="ok">{f.ok}</Alert>
        <Field label="Password saat ini" name="current_password" type="password" value={f.values.current_password} onChange={f.onChange} error={f.errors.current_password} />
        <Field label="Password baru (min. 8 karakter)" name="password" type="password" value={f.values.password} onChange={f.onChange} error={f.errors.password} />
        <Field label="Ulangi password baru" name="password_confirmation" type="password" value={f.values.password_confirmation} onChange={f.onChange} />
        <button className="btn btn-primary" disabled={f.busy}>{f.busy ? 'Menyimpan…' : 'Ubah password'}</button>
      </form>
    </div>
  )
}
