import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import AuthShell, { Field, Alert, useForm } from './AuthShell.jsx'

export default function ResetPassword() {
  const [q] = useSearchParams()
  const nav = useNavigate()
  const f = useForm({ password: '', password_confirmation: '' }, async (v, setOk) => {
    const r = await api('/auth/reset-password', { method: 'POST', body: { ...v, token: q.get('token'), email: q.get('email') } })
    setOk(r.message); setTimeout(() => nav('/login'), 1500)
  })
  const bad = !q.get('token') || !q.get('email')
  return (
    <AuthShell icon="key" title="Buat password baru" footer={<Link className="font-semibold text-brand-500" to="/login">Kembali ke halaman masuk</Link>}>
      {bad ? <Alert>Tautan reset tidak lengkap. Minta tautan baru di halaman lupa password.</Alert> : (
        <form onSubmit={f.onSubmit} className="space-y-4" noValidate>
          <Alert>{f.message}</Alert><Alert kind="ok">{f.ok}</Alert>
          <Field label="Password baru (min. 8 karakter)" name="password" type="password" value={f.values.password} onChange={f.onChange} error={f.errors.password} />
          <Field label="Ulangi password baru" name="password_confirmation" type="password" value={f.values.password_confirmation} onChange={f.onChange} />
          <button className="btn btn-primary w-full" disabled={f.busy}>{f.busy ? 'Menyimpan…' : 'Simpan password'}</button>
        </form>
      )}
    </AuthShell>
  )
}
