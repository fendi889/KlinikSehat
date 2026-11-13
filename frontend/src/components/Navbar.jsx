import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  ['Beranda', '#top', 'home'], ['Tentang', '#tentang', 'info'], ['Layanan', '#layanan', 'heart'],
  ['Dokter', '#dokter', 'user'], ['Jadwal', '#jadwal', 'calendar'], ['Kontak', '#kontak', 'phone'],
]
const extra = [['Alur', '#alur', 'list'], ['FAQ', '#faq', 'help-circle']]

export function Logo({ light = false, size = 'md' }) {
  const box = size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
  return (
    <span className={`flex items-center gap-2.5 font-display font-extrabold ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}>
      <span className={`grid ${box} place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-soft`} aria-hidden="true">
        <Icon name="cross" className="h-6 w-6" strokeWidth={2.5} />
      </span>
      <span className={light ? 'text-white' : 'text-brand-600'}>Klinik<span className={light ? 'text-sky-200' : 'text-brand-900'}>Sehat</span></span>
    </span>
  )
}

export default function Navbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('#top')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    const ids = [...links, ...extra].map((l) => l[1].slice(1))
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!('IntersectionObserver' in window) || !els.length) return
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)), { rootMargin: '-40% 0px -55% 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const cta = user
    ? <Link to={user.dashboard} className="btn btn-primary"><Icon name="monitor" className="h-4 w-4" />Dashboard</Link>
    : <Link to="/login" className="btn btn-primary"><Icon name="user" className="h-4 w-4" />Daftar / Login</Link>

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'border-b border-brand-100 bg-white/90 shadow-card backdrop-blur' : 'bg-white/70 backdrop-blur'}`}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3" aria-label="Navigasi utama">
        <a href="#top" aria-label="KlinikSehat, ke atas"><Logo /></a>
        <ul className="hidden items-center gap-1 text-sm font-semibold lg:flex">
          {links.map(([t, h, ic]) => (
            <li key={h}>
              <a href={h} aria-current={active === h ? 'true' : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-2 transition-colors ${active === h ? 'bg-brand-500 text-white shadow-soft' : 'text-brand-900 hover:bg-brand-50'}`}>
                <Icon name={ic} className="h-4 w-4" />{t}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden lg:block">{cta}</div>
        <button className="grid h-11 w-11 place-items-center rounded-xl border border-brand-200 text-brand-700 transition hover:bg-brand-50 lg:hidden"
          aria-expanded={open} aria-controls="menu-mobile" aria-label={open ? 'Tutup menu' : 'Buka menu'} onClick={() => setOpen(!open)}>
          <Icon name={open ? 'x' : 'menu'} className="h-6 w-6" />
        </button>
      </nav>
      <div id="menu-mobile" className={`grid overflow-hidden border-brand-100 bg-white transition-all duration-300 lg:hidden ${open ? 'grid-rows-[1fr] border-t' : 'grid-rows-[0fr]'}`}>
        <div className="min-h-0 overflow-hidden">
          <ul className="grid gap-1 px-4 py-3">
            {[...links, ...extra].map(([t, h, ic]) => (
              <li key={h}><a onClick={() => setOpen(false)} href={h} tabIndex={open ? 0 : -1} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-brand-50"><Icon name={ic} className="h-5 w-5 text-brand-500" />{t}</a></li>
            ))}
            <li className="pt-2" onClick={() => setOpen(false)}>{cta}</li>
          </ul>
        </div>
      </div>
    </header>
  )
}
