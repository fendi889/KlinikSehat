import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/Navbar.jsx'
import Icon from '../../components/Icon.jsx'
import { HealthIllustration } from '../../components/Illustrations.jsx'

/** Kolom isian dengan ikon opsional. Kolom password otomatis punya tombol tampil/sembunyikan. */
export function Field({ label, name, type = 'text', value, onChange, error, icon, ...rest }) {
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-bold">{label}</label>
      <div className="relative">
        {icon && <Icon name={icon} className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-400" />}
        <input
          id={name} name={name} type={isPw && show ? 'text' : type} value={value} onChange={onChange}
          aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined}
          className={`min-h-[46px] w-full rounded-xl border bg-white text-brand-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 ${icon ? 'pl-11' : 'pl-3'} ${isPw ? 'pr-12' : 'pr-3'} ${error ? 'border-red-500' : 'border-brand-200'}`}
          {...rest}
        />
        {isPw && (
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={show}
            className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-brand-700 transition hover:bg-brand-100">
            <Icon name={show ? 'eye-off' : 'eye'} className="h-5 w-5" />
          </button>
        )}
      </div>
      {error && <p id={`${name}-err`} className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null
  const c = kind === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-800 border-green-100'
  return <p role={kind === 'error' ? 'alert' : 'status'} className={`animate-fade-in rounded-xl border p-3 text-sm ${c}`}>{children}</p>
}

/** Tata letak dua kolom: kiri logo + ilustrasi, kanan formulir. Dipakai login, daftar, lupa dan reset password. */
export default function AuthShell({ title, subtitle, icon = 'lock', children, footer }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-sky-400 p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <Link to="/" aria-label="KlinikSehat, ke beranda"><Logo light size="lg" /></Link>
        <p className="mt-3 text-lg text-brand-100">Sehat Bersama, Hidup Lebih Baik</p>
        <div className="flex flex-1 items-center justify-center"><HealthIllustration className="w-full max-w-md animate-float" /></div>
        <ul className="grid gap-2 text-sm text-brand-50">
          {['Antrian online real-time', 'Rekam medis digital yang aman', 'Resep dan pembayaran dalam satu aplikasi'].map((t) => (
            <li key={t} className="flex items-center gap-2"><Icon name="check" className="h-4 w-4" strokeWidth={3} />{t}</li>
          ))}
        </ul>
      </aside>

      <section className="flex flex-col bg-white px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-50 hover:text-brand-500">
            <Icon name="arrow-left" className="h-4 w-4" />Kembali ke Beranda
          </Link>
          <Link to="/" className="lg:hidden" aria-label="KlinikSehat"><Logo /></Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 animate-fade-up flex-col justify-center py-8">
          <div className="mb-6">
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-500"><Icon name={icon} className="h-6 w-6" /></span>
            <h1 className="text-3xl font-extrabold">{title}</h1>
            {subtitle && <p className="mt-1 text-brand-700">{subtitle}</p>}
          </div>
          {children}
          {footer && <p className="mt-6 text-center text-sm text-brand-700">{footer}</p>}
        </div>
      </section>
    </main>
  )
}

// Hook form kecil: state, error per field, status kirim.
export function useForm(initial, submit) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
  const onSubmit = async (e) => {
    e.preventDefault(); setBusy(true); setErrors({}); setMessage(''); setOk('')
    try { await submit(values, setOk) }
    catch (err) {
      setMessage(err.message)
      setErrors(Object.fromEntries(Object.entries(err.errors || {}).map(([k, v]) => [k, v[0]])))
    } finally { setBusy(false) }
  }
  return { values, setValues, errors, message, ok, busy, onChange, onSubmit }
}
