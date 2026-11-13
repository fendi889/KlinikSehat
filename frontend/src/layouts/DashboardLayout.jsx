import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLES } from '../config/roles.js'
import { Logo } from '../components/Navbar.jsx'
import Icon from '../components/Icon.jsx'
import { api } from '../services/api.js'

// Ikon menu berdasarkan slug halaman.
const ICON = {
  pasien: 'users', dokter: 'stethoscope', staf: 'user-plus', poli: 'building', jadwal: 'calendar', layanan: 'briefcase', ruang: 'door', antrian: 'list',
  pembayaran: 'credit-card', laporan: 'bar-chart', pengaturan: 'settings', akun: 'users', role: 'shield', permission: 'key', klinik: 'building',
  aktivitas: 'activity', audit: 'file-text', keuangan: 'wallet', kinerja: 'trending-up', grafik: 'bar-chart', monitoring: 'monitor',
  pemeriksaan: 'stethoscope', 'rekam-medis': 'clipboard', resep: 'pill', surat: 'file-text', riwayat: 'history', pendaftaran: 'user-plus',
  verifikasi: 'shield-check', 'tanda-vital': 'activity', obat: 'pill', kategori: 'tag', stok: 'package', kedaluwarsa: 'alert', daftar: 'calendar-plus',
  notifikasi: 'bell', ulasan: 'star', 'data-diri': 'user',
}

function SideLink({ to, icon, end, children }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-brand-500 text-white shadow-soft' : 'text-brand-100 hover:bg-white/10 hover:text-white'}`}>
      <Icon name={icon} className="h-5 w-5 shrink-0" />{children}
    </NavLink>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [unread, setUnread] = useState(0)
  const menuRef = useRef(null)
  const role = ROLES[user.role]
  const inisial = user.name.split(' ').slice(0, 2).map((x) => x[0]).join('').toUpperCase()

  useEffect(() => { setOpen(false); setMenu(false) }, [loc.pathname])
  useEffect(() => {
    const load = () => api('/notifications/unread').then((r) => setUnread(r.jumlah)).catch(() => {})
    load(); const t = setInterval(load, 30000); return () => clearInterval(t)
  }, [])
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') { setOpen(false); setMenu(false) } }
    const klik = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false) }
    window.addEventListener('keydown', esc); document.addEventListener('mousedown', klik)
    return () => { window.removeEventListener('keydown', esc); document.removeEventListener('mousedown', klik) }
  }, [])

  const out = async () => { await logout(); nav('/login', { replace: true }) }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-brand-100/60 lg:pl-64">
      {open && <div className="fixed inset-0 z-30 animate-fade-in bg-brand-950/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      {/* Sidebar Kiri Standar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-950 text-white transition-[transform,visibility] duration-300 lg:visible lg:translate-x-0 ${open ? 'visible translate-x-0' : 'invisible -translate-x-full'}`} aria-label="Navigasi samping">
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/" aria-label="KlinikSehat, ke beranda"><Logo light /></Link>
          <button className="grid h-9 w-9 place-items-center rounded-lg text-brand-200 hover:bg-white/10 lg:hidden" aria-label="Tutup menu" onClick={() => setOpen(false)}><Icon name="x" /></button>
        </div>
        <nav aria-label="Menu dashboard" className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <SideLink to={role.path} end icon="home">Dashboard</SideLink>
          {role.menu.map((x) => <SideLink key={x.slug} to={`${role.path}/${x.slug}`} icon={ICON[x.slug] || 'dot'}>{x.label}</SideLink>)}
          <div className="my-3 border-t border-white/10" />
          <SideLink to="/profil" icon="user">Profil saya</SideLink>
          <SideLink to="/ubah-password" icon="lock">Ubah password</SideLink>
        </nav>
        <div className="border-t border-white/10 p-3">
          <button onClick={out} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-white/10"><Icon name="log-out" className="h-5 w-5" />Keluar</button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-brand-100 bg-white/90 px-4 py-3 backdrop-blur shrink-0">
          <button className="grid h-11 w-11 place-items-center rounded-xl border border-brand-200 text-brand-700 transition hover:bg-brand-50 lg:hidden" aria-label="Buka menu" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" className="h-6 w-6" /></button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-brand-700">Selamat datang kembali,</p>
            <p className="truncate font-extrabold leading-tight">{user.name}</p>
          </div>

          <Link to="/notifikasi" aria-label={`Notifikasi, ${unread} belum dibaca`} className="relative grid h-11 w-11 place-items-center rounded-xl border border-brand-200 text-brand-700 transition hover:bg-brand-50">
            <Icon name="bell" />
            {unread > 0 && <span className="absolute -right-1.5 -top-1.5 min-w-[20px] animate-fade-in rounded-full bg-red-600 px-1 text-center text-xs font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
          </Link>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenu(!menu)} aria-haspopup="menu" aria-expanded={menu} className="flex items-center gap-2 rounded-xl border border-brand-200 py-1.5 pl-1.5 pr-2.5 transition hover:bg-brand-50">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-extrabold text-white">{inisial}</span>
              <span className="hidden text-left sm:block"><span className="block max-w-[9rem] truncate text-sm font-bold leading-tight">{user.name}</span><span className="block text-xs text-brand-700">{role.label}</span></span>
              <Icon name="chevron-down" className={`h-4 w-4 text-brand-700 transition-transform ${menu ? 'rotate-180' : ''}`} />
            </button>
            {menu && (
              <div role="menu" className="card absolute right-0 mt-2 w-60 animate-fade-in p-2 z-50 bg-white shadow-lg">
                <div className="border-b border-brand-100 px-3 pb-2 pt-1"><p className="truncate font-bold">{user.name}</p><p className="truncate text-xs text-brand-700">{user.email}</p></div>
                <Link role="menuitem" to="/profil" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-brand-50"><Icon name="user" className="h-4 w-4 text-brand-500" />Profil saya</Link>
                <Link role="menuitem" to="/ubah-password" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-brand-50"><Icon name="lock" className="h-4 w-4 text-brand-500" />Ubah password</Link>
                <Link role="menuitem" to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-brand-50"><Icon name="home" className="h-4 w-4 text-brand-500" />Beranda website</Link>
                <button role="menuitem" onClick={out} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Icon name="log-out" className="h-4 w-4" />Keluar</button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8"><div key={loc.pathname} className="animate-fade-up"><Outlet /></div></main>
      </div>
    </div>
  )
}
