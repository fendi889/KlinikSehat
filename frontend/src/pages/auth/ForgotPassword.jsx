import { Link } from 'react-router-dom'
import { api } from '../../services/api.js'
import AuthShell, { Field, Alert, useForm } from './AuthShell.jsx'

export default function ForgotPassword() {
  const f = useForm({ email: '' }, async (v, setOk) => {
    const r = await api('/auth/forgot-password', { method: 'POST', body: v }); setOk(r.message)
  })
  return (
    <AuthShell icon="mail" title="Lupa password" subtitle="Masukkan email akun Anda, kami kirim tautan untuk membuat password baru."
      footer={<Link className="font-semibold text-brand-500" to="/login">Kembali ke halaman masuk</Link>}>
      <form onSubmit={f.onSubmit} className="space-y-4" noValidate>
        <Alert>{f.message}</Alert><Alert kind="ok">{f.ok}</Alert>
        <Field label="Email" icon="mail" name="email" type="email" value={f.values.email} onChange={f.onChange} error={f.errors.email} />
        <button className="btn btn-primary w-full" disabled={f.busy}>{f.busy ? 'Mengirim…' : 'Kirim tautan reset'}</button>
      </form>
    </AuthShell>
  )
}
