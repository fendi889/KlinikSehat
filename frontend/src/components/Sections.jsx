import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './Navbar.jsx'
import Icon from './Icon.jsx'
import { api } from '../services/api.js'
import * as d from '../data/content.js'

function Section({ id, eyebrow, title, intro, children, tint }) {
  return (
    <section id={id} className={tint ? 'bg-gradient-to-b from-brand-50 to-white' : 'bg-white'}>
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="animate-fade-up">
          {eyebrow && <p className="mb-2 text-sm font-bold uppercase tracking-wider text-brand-500">{eyebrow}</p>}
          <h2 className="text-3xl font-extrabold md:text-4xl">{title}</h2>
          {intro && <p className="mt-3 max-w-2xl text-brand-700">{intro}</p>}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  )
}

const Check = () => <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-sehat" strokeWidth={3} />

export function Statistik() {
  const ic = ['users', 'stethoscope', 'building', 'star']
  return (
    <section className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-600 text-white" aria-label="Statistik klinik">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
        {d.stats.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15"><Icon name={ic[i]} className="h-6 w-6" /></span>
            <div><dd className="text-2xl font-extrabold md:text-3xl">{s.nilai}</dd><dt className="text-sm text-brand-200">{s.label}</dt></div>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function AntrianLangsung() {
  const [data, setData] = useState(null)
  useEffect(() => {
    const load = () => api('/public/queue-board').then(setData).catch(() => setData(null))
    load(); const t = setInterval(load, 5000); return () => clearInterval(t)
  }, [])
  if (!data || data.length === 0) return null
  return (
    <Section id="antrian-langsung" eyebrow="Real-time" title="Antrian hari ini" intro="Pantau nomor yang sedang dipanggil sebelum berangkat. Diperbarui otomatis.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((p) => (
          <article key={p.poli} className="card card-hover p-5">
            <div className="flex items-center justify-between"><h3 className="font-bold">{p.poli}</h3><span className="text-xs font-semibold text-brand-700">{p.menunggu} menunggu</span></div>
            <p className="mt-3 text-xs text-brand-700">Sedang dipanggil</p>
            <p className={`text-5xl font-extrabold ${p.sekarang ? 'text-brand-500' : 'text-brand-200'}`}>{p.sekarang || '—'}</p>
            <p className="mt-2 text-sm text-brand-700">Berikutnya: <b>{p.berikutnya.length ? p.berikutnya.join(' · ') : '—'}</b></p>
          </article>
        ))}
      </div>
      <Link to="/antrian" className="btn btn-outline mt-6"><Icon name="monitor" className="h-4 w-4 text-brand-500" />Buka layar antrian penuh</Link>
    </Section>
  )
}

export function Tentang() {
  return (
    <Section id="tentang" eyebrow="Tentang kami" title="Klinik yang menghargai waktu dan data Anda">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4 text-brand-700">
          <p>KlinikSehat berdiri untuk satu hal: pemeriksaan yang teliti tanpa antrian yang melelahkan. Setiap pasien punya akun, riwayat periksa, dan resep yang bisa dibuka kapan saja dari HP.</p>
          <p>Dokter, perawat, apoteker, dan kasir bekerja dalam satu sistem sehingga data Anda tidak perlu ditanyakan berulang di tiap meja.</p>
        </div>
        <div className="grid gap-4">
          <div className="card p-5"><h3 className="flex items-center gap-2 font-bold"><Icon name="star" className="h-5 w-5 text-brand-500" />Visi</h3><p className="mt-2 text-brand-700">{d.visi}</p></div>
          <div className="card p-5"><h3 className="flex items-center gap-2 font-bold"><Icon name="check" className="h-5 w-5 text-brand-500" />Misi</h3>
            <ul className="mt-2 space-y-2 text-brand-700">{d.misi.map((m) => <li key={m} className="flex gap-2"><Check />{m}</li>)}</ul></div>
        </div>
      </div>
    </Section>
  )
}

export function Layanan() {
  const ic = ['stethoscope', 'shield-check', 'heart', 'users', 'activity', 'clipboard']
  return (
    <Section id="layanan" tint eyebrow="Layanan" title="Layanan klinik" intro="Tarif dapat berubah dan dikelola admin klinik.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {d.layanan.map((l, i) => (
          <article key={l.nama} className="card card-hover flex flex-col p-6">
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-100 text-brand-500"><Icon name={ic[i % ic.length]} className="h-6 w-6" /></span>
            <h3 className="text-lg font-bold">{l.nama}</h3>
            <p className="mt-2 flex-1 text-brand-700">{l.desc}</p>
            <p className="mt-4 font-bold text-brand-500">{l.tarif}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}

export function Dokter() {
  return (
    <Section id="dokter" eyebrow="Tim medis" title="Dokter kami">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {d.dokter.map((x) => (
          <article key={x.id} className="card card-hover flex items-center gap-4 p-5">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-xl font-extrabold text-white" aria-hidden="true">{x.inisial}</div>
            <div className="min-w-0">
              <h3 className="font-bold">{x.nama}</h3>
              <p className="text-brand-700">{x.poli}</p>
              <p className="text-sm text-brand-700">Pengalaman {x.pengalaman}</p>
              <a href="#jadwal" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline">Lihat jadwal<Icon name="arrow-right" className="h-3.5 w-3.5" /></a>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm text-brand-700">Foto dokter akan diunggah admin klinik lewat dashboard.</p>
    </Section>
  )
}

export function Jadwal() {
  return (
    <Section id="jadwal" tint eyebrow="Jadwal" title="Jadwal praktik dokter" intro="Geser tabel ke samping di layar kecil.">
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-brand-100">
            <tr><th className="p-3">Dokter</th>{d.hari.map((h) => <th key={h} className="p-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {d.dokter.map((x) => (
              <tr key={x.id} className="border-t border-brand-100 transition-colors hover:bg-brand-50">
                <th scope="row" className="p-3 font-bold">{x.nama}<span className="block font-normal text-brand-700">{x.poli}</span></th>
                {d.jadwal[x.id].map((j, i) => <td key={i} className="p-3">{j ?? <span className="text-brand-300">Libur</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link to="/daftar" className="btn btn-primary mt-6"><Icon name="calendar-plus" className="h-4 w-4" />Daftar sesuai jadwal</Link>
    </Section>
  )
}

export function Alur() {
  return (
    <Section id="alur" eyebrow="Cara daftar" title="Alur pendaftaran">
      <ol className="grid gap-5 md:grid-cols-5">
        {d.alur.map((a, i) => (
          <li key={a.judul} className="card card-hover relative p-5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-500 font-extrabold text-white shadow-soft">{i + 1}</span>
            <h3 className="mt-3 font-bold">{a.judul}</h3>
            <p className="mt-1 text-sm text-brand-700">{a.desc}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

export function Fasilitas() {
  return (
    <Section id="fasilitas" tint eyebrow="Fasilitas" title="Fasilitas klinik">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {d.fasilitas.map((f) => <li key={f} className="card card-hover flex items-start gap-3 p-5"><Check />{f}</li>)}
      </ul>
    </Section>
  )
}

export function Testimoni() {
  return (
    <Section id="testimoni" eyebrow="Testimoni" title="Kata pasien">
      <div className="grid gap-5 md:grid-cols-3">
        {d.testimoni.map((t) => (
          <figure key={t.nama} className="card card-hover p-6">
            <div className="mb-3 flex gap-0.5 text-yellow-400" aria-label="Penilaian 5 dari 5">{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" className="h-4 w-4 fill-current" />)}</div>
            <blockquote className="text-brand-700">“{t.teks}”</blockquote>
            <figcaption className="mt-4 font-bold">{t.nama}<span className="font-normal text-brand-700"> · {t.poli}</span></figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}

export function Artikel() {
  return (
    <Section id="artikel" tint eyebrow="Edukasi" title="Artikel kesehatan">
      <div className="grid gap-5 md:grid-cols-3">
        {d.artikel.map((a) => (
          <article key={a.slug} className="card card-hover flex flex-col p-6">
            <time className="text-sm text-brand-700">{a.tanggal}</time>
            <h3 className="mt-2 text-lg font-bold">{a.judul}</h3>
            <p className="mt-2 flex-1 text-brand-700">{a.ringkas}</p>
            <Link to={`/artikel/${a.slug}`} className="mt-4 inline-flex items-center gap-1 font-semibold text-brand-500 hover:underline">Baca artikel<Icon name="arrow-right" className="h-4 w-4" /></Link>
          </article>
        ))}
      </div>
    </Section>
  )
}

export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <Section id="faq" eyebrow="Bantuan" title="Pertanyaan yang sering diajukan">
      <div className="card max-w-3xl divide-y divide-brand-100">
        {d.faq.map((f, i) => (
          <div key={f.q}>
            <h3>
              <button className="flex min-h-[56px] w-full items-center justify-between gap-4 px-5 text-left font-bold" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q}<Icon name="chevron-down" className={`h-5 w-5 shrink-0 text-brand-500 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`} />
              </button>
            </h3>
            <div className={`grid transition-all duration-300 ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <p id={`faq-${i}`} className="overflow-hidden px-5 text-brand-700"><span className="block pb-5">{f.a}</span></p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

export function Kontak() {
  const c = d.clinic
  const baris = [['map-pin', 'Alamat', c.alamat], ['phone', 'Telepon', c.telp], ['phone', 'WhatsApp', c.wa], ['mail', 'Email', c.email], ['clock', 'Jam buka', c.jam]]
  return (
    <Section id="kontak" tint eyebrow="Hubungi kami" title="Kontak dan lokasi">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <dl className="space-y-4">
            {baris.map(([ic, k, v]) => (
              <div key={k} className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-500"><Icon name={ic} /></span><div><dt className="font-bold">{k}</dt><dd className="text-brand-700">{v}</dd></div></div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-3 pt-5">
            <a className="btn btn-primary" href={`https://wa.me/62${c.wa.replace(/\D/g, '').slice(1)}`} target="_blank" rel="noreferrer"><Icon name="send" className="h-4 w-4" />Chat WhatsApp</a>
            <a className="btn btn-outline" href={`tel:${c.telp.replace(/[^\d]/g, '')}`}><Icon name="phone" className="h-4 w-4 text-brand-500" />Telepon</a>
          </div>
        </div>
        <iframe title="Peta lokasi KlinikSehat" className="h-72 w-full rounded-2xl border border-brand-100 shadow-card lg:h-full" loading="lazy" src="https://www.google.com/maps?q=Menteng,+Jakarta+Pusat&output=embed" />
      </div>
    </Section>
  )
}

export function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2"><Logo light /><p className="mt-3 max-w-sm text-sm">Klinik rawat jalan dengan antrian online dan rekam medis digital. Sehat bersama, hidup lebih baik.</p></div>
        <nav aria-label="Tautan footer">
          <p className="font-bold text-white">Menu</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[['#layanan', 'Layanan'], ['#jadwal', 'Jadwal dokter'], ['#alur', 'Alur pendaftaran'], ['#faq', 'FAQ']].map(([h, t]) => <li key={h}><a className="transition hover:text-white" href={h}>{t}</a></li>)}
            <li><Link className="transition hover:text-white" to="/antrian">Layar antrian</Link></li>
            <li><Link className="transition hover:text-white" to="/login">Masuk</Link></li>
            <li><Link className="transition hover:text-white" to="/daftar">Daftar pasien</Link></li>
          </ul>
        </nav>
        <div className="text-sm"><p className="font-bold text-white">Hubungi kami</p><p className="mt-3">{d.clinic.telp}</p><p>{d.clinic.email}</p></div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-sm">© 2026 KlinikSehat. Seluruh hak dilindungi.</p>
    </footer>
  )
}
