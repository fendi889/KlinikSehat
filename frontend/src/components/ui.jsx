import Icon from './Icon.jsx'

export function PageHeader({ title, desc, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold md:text-3xl">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-brand-700">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

export function Pager({ page, onPage }) {
  if (!page || page.last_page <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-brand-700">Halaman {page.current_page} dari {page.last_page} · {page.total} data</span>
      <div className="flex gap-2">
        <button className="btn btn-outline min-h-[40px] px-3" disabled={page.current_page <= 1} onClick={() => onPage(page.current_page - 1)}>Sebelumnya</button>
        <button className="btn btn-outline min-h-[40px] px-3" disabled={page.current_page >= page.last_page} onClick={() => onPage(page.current_page + 1)}>Berikutnya</button>
      </div>
    </div>
  )
}

// TableWrap in ui.jsx
export function TableWrap({ children }) {
  return <div className="overflow-x-auto rounded-xl border border-brand-200 bg-white"><table className="w-full min-w-[640px] text-left text-sm">{children}</table></div>
}

export const Th = ({ children }) => <th className="bg-brand-100 p-3 font-semibold">{children}</th>
export const Td = ({ children, className = '' }) => <td className={`border-t border-brand-100 p-3 ${className}`}>{children}</td>

export function Empty({ children }) {
  return <p className="rounded-xl border border-dashed border-brand-200 bg-white p-8 text-center text-brand-700">{children}</p>
}

export const fmtTanggal = (s) => (s ? new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-')

export const rupiah = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID')

export function StatCard({ label, value, tone }) {
  const c = tone === 'bad' ? 'text-red-600' : tone === 'good' ? 'text-sehat' : ''
  return (
    <div className="card card-hover p-5">
      <dt className="text-sm text-brand-700">{label}</dt>
      <dd className={`mt-1 font-display text-2xl font-bold md:text-3xl ${c}`}>{value}</dd>
    </div>
  )
}

export function DateRange({ from, to, onChange }) {
  const cls = 'min-h-[44px] rounded-lg border border-brand-200 bg-white px-3'
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div><label htmlFor="dr-from" className="mb-1 block text-sm font-semibold">Dari</label><input id="dr-from" type="date" value={from} max={to} onChange={(e) => onChange(e.target.value, to)} className={cls} /></div>
      <div><label htmlFor="dr-to" className="mb-1 block text-sm font-semibold">Sampai</label><input id="dr-to" type="date" value={to} min={from} onChange={(e) => onChange(from, e.target.value)} className={cls} /></div>
    </div>
  )
}

export const isoDay = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10) }

export const tglPanjang = (s) => (s ? new Date(s).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-')

const STATUS = {
  terdaftar: ['Terdaftar', 'bg-brand-100 text-brand-700'], menunggu: ['Menunggu', 'bg-brand-100 text-brand-700'],
  menunggu_dokter: ['Menunggu dokter', 'bg-brand-100 text-brand-700'], dipanggil: ['Dipanggil', 'bg-green-100 text-green-800'],
  dilayani: ['Dilayani', 'bg-green-100 text-green-800'], diperiksa: ['Diperiksa', 'bg-green-100 text-green-800'],
  selesai: ['Selesai', 'bg-gray-100 text-gray-700'], batal: ['Batal', 'bg-red-100 text-red-700'], terlewat: ['Terlewat', 'bg-red-100 text-red-700'],
  lunas: ['Lunas', 'bg-green-100 text-green-800'], belum_bayar: ['Belum bayar', 'bg-yellow-100 text-yellow-800'],
  menunggu_verifikasi: ['Menunggu verifikasi', 'bg-yellow-100 text-yellow-800'], terverifikasi: ['Terverifikasi', 'bg-green-100 text-green-800'],
  baru: ['Baru', 'bg-brand-100 text-brand-700'], diproses: ['Diproses', 'bg-yellow-100 text-yellow-800'], siap: ['Siap diambil', 'bg-green-100 text-green-800'], diserahkan: ['Diserahkan', 'bg-gray-100 text-gray-700'],
}
export function StatusBadge({ status }) {
  const [t, c] = STATUS[status] || [status, 'bg-gray-100 text-gray-700']
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${c}`}>{t}</span>
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))


const TONES = {
  blue: ['bg-brand-50', 'bg-brand-100 text-brand-500'], green: ['bg-emerald-50', 'bg-emerald-100 text-emerald-600'],
  purple: ['bg-violet-50', 'bg-violet-100 text-violet-600'], orange: ['bg-orange-50', 'bg-orange-100 text-orange-600'],
}
export const TONE_LIST = ['blue', 'green', 'purple', 'orange']

/** Kartu statistik dengan ikon berwarna dan tren (naik/turun) opsional. trend: angka persen, null = tidak ada pembanding, undefined = tanpa tren. */
export function StatTile({ icon, label, value, trend, tone = 'blue' }) {
  const [bg, ic] = TONES[tone] || TONES.blue
  return (
    <div className={`card card-hover flex items-start gap-4 p-5 ${bg}`}>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${ic}`}><Icon name={icon} className="h-6 w-6" /></span>
      <div className="min-w-0">
        <dt className="text-sm text-brand-700">{label}</dt>
        <dd className="truncate text-2xl font-extrabold">{value}</dd>
        {trend === null && <p className="text-xs text-brand-700">belum ada pembanding</p>}
        {typeof trend === 'number' && (
          <p className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <Icon name={trend >= 0 ? 'arrow-up' : 'arrow-down'} className="h-3.5 w-3.5" strokeWidth={3} />{Math.abs(trend)}% <span className="font-normal text-brand-700">dibanding periode lalu</span>
          </p>
        )}
      </div>
    </div>
  )
}
