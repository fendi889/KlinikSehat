import { useState } from 'react'
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Icon from '../../components/Icon.jsx'
import AuthShell, { Field, Alert, useForm } from './AuthShell.jsx'

export default function Login() {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [remember, setRemember] = useState(true)

  // Tujuan setelah masuk: halaman pendaftaran pasien bila datang dari form beranda, selain itu dashboard role.
  const tujuan = (u) => {
    const next = new URLSearchParams(loc.search).get('next')
    return u.role === 'pasien' && next && next.startsWith('/pasien') ? next : u.dashboard
  }
  const f = useForm({ email: '', password: '' }, async (v) => {
    const u = await login(v.email, v.password, remember)
    nav(tujuan(u), { replace: true })
  })
  if (user) return <Navigate to={tujuan(user)} replace />

  return (
    <AuthShell title="Masuk ke Akun" subtitle="Silakan login untuk melanjutkan."
      footer={<>Belum punya akun? <Link className="font-bold text-brand-500 hover:underline" to="/daftar">Daftar Sekarang</Link></>}>
      <form onSubmit={f.onSubmit} className="space-y-4" noValidate>
        <Alert>{f.message}</Alert>
        <Field label="Email" name="email" type="email" icon="mail" placeholder="nama@email.com" autoComplete="email" value={f.values.email} onChange={f.onChange} error={f.errors.email} />
        <Field label="Password" name="password" type="password" icon="lock" placeholder="Masukkan password" autoComplete="current-password" value={f.values.password} onChange={f.onChange} error={f.errors.password} />
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 font-semibold">
            <input type="checkbox" className="h-4 w-4 rounded border-brand-300 text-brand-500 focus:ring-brand-300" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Ingat saya
          </label>
          <Link to="/lupa-password" className="font-bold text-brand-500 hover:underline">Lupa Password?</Link>
        </div>
        <button className="btn btn-primary w-full" disabled={f.busy}>
          {f.busy ? 'Memproses…' : <>Masuk<Icon name="arrow-right" className="h-4 w-4" /></>}
        </button>
      </form>
    </AuthShell>
  )
}
