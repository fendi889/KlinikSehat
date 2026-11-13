import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import AuthShell, { Field, Alert, useForm } from './AuthShell.jsx'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const f = useForm(
    { name: '', email: '', phone: '', nik: '', tgl_lahir: '', jenis_kelamin: 'L', password: '', password_confirmation: '' },
    async (v) => { const u = await register(v); nav(u.dashboard, { replace: true }) }
  )
  const p = (n) => ({ name: n, value: f.values[n], onChange: f.onChange, error: f.errors[n] })
  return (
    <AuthShell icon="user-plus" title="Daftar pasien baru" subtitle="Akun pasien dibuat langsung dengan nomor rekam medis."
      footer={<>Sudah punya akun? <Link className="font-semibold text-brand-500" to="/login">Masuk</Link></>}>
      <form onSubmit={f.onSubmit} className="space-y-4" noValidate>
        <Alert>{f.message}</Alert>
        <Field label="Nama lengkap" icon="user" {...p('name')} autoComplete="name" />
        <Field label="Email" icon="mail" type="email" {...p('email')} autoComplete="email" />
        <Field label="Nomor HP" icon="phone" type="tel" {...p('phone')} autoComplete="tel" />
        <Field label="NIK (16 digit, opsional)" {...p('nik')} inputMode="numeric" maxLength={16} />
        <Field label="Tanggal lahir" type="date" {...p('tgl_lahir')} />
        <div>
          <label htmlFor="jk" className="mb-1 block text-sm font-semibold">Jenis kelamin</label>
          <select id="jk" name="jenis_kelamin" value={f.values.jenis_kelamin} onChange={f.onChange} className="min-h-[46px] w-full rounded-xl border border-brand-200 bg-white px-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200">
            <option value="L">Laki-laki</option><option value="P">Perempuan</option>
          </select>
        </div>
        <Field label="Password (min. 8 karakter)" type="password" {...p('password')} autoComplete="new-password" />
        <Field label="Ulangi password" type="password" {...p('password_confirmation')} autoComplete="new-password" />
        <button className="btn btn-primary w-full" disabled={f.busy}>{f.busy ? 'Memproses…' : 'Buat akun'}</button>
      </form>
    </AuthShell>
  )
}
