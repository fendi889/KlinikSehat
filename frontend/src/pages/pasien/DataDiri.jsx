import { useEffect } from 'react'
import { api } from '../../services/api.js'
import { PageHeader } from '../../components/ui.jsx'
import { Field, Alert, useForm } from '../auth/AuthShell.jsx'

export default function DataDiri() {
  const f = useForm({ nama: '', nik: '', tgl_lahir: '', jenis_kelamin: '', golongan_darah: '', alamat: '', alergi: '', kontak_darurat: '', phone: '', no_rm: '' }, async (v, setOk) => {
    const body = Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'no_rm' && k !== 'email').map(([k, x]) => [k, x === '' ? null : x]))
    await api('/pasien/profile', { method: 'PUT', body }); setOk('Data diri disimpan.')
  })
  const { setValues } = f
  useEffect(() => { api('/pasien/profile').then((p) => setValues(Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? ''])))).catch(() => {}) }, [setValues])
  const p = (n) => ({ name: n, value: f.values[n] ?? '', onChange: f.onChange, error: f.errors[n] })
  const sel = (n, label, opts) => (
    <div><label htmlFor={n} className="mb-1 block text-sm font-semibold">{label}</label>
      <select id={n} name={n} value={f.values[n] ?? ''} onChange={f.onChange} className="min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3"><option value="">Pilih…</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      {f.errors[n] && <p className="mt-1 text-sm text-red-600">{f.errors[n]}</p>}</div>
  )
  return (
    <div className="max-w-xl">
      <PageHeader title="Data diri" desc={f.values.no_rm ? `No. rekam medis: ${f.values.no_rm}` : undefined} />
      <form onSubmit={f.onSubmit} noValidate className="space-y-4 rounded-xl border border-brand-200 bg-white p-5">
        <Alert>{f.message}</Alert><Alert kind="ok">{f.ok}</Alert>
        <Field label="Nama lengkap" {...p('nama')} /><Field label="Nomor HP" type="tel" {...p('phone')} /><Field label="NIK (16 digit)" {...p('nik')} inputMode="numeric" maxLength={16} />
        <Field label="Tanggal lahir" type="date" {...p('tgl_lahir')} />
        {sel('jenis_kelamin', 'Jenis kelamin', [['L', 'Laki-laki'], ['P', 'Perempuan']])}
        {sel('golongan_darah', 'Golongan darah', ['A', 'B', 'AB', 'O'].map((x) => [x, x]))}
        <Field label="Kontak darurat" {...p('kontak_darurat')} />
        <div><label htmlFor="alamat" className="mb-1 block text-sm font-semibold">Alamat</label><textarea id="alamat" name="alamat" rows={2} value={f.values.alamat ?? ''} onChange={f.onChange} className="w-full rounded-lg border border-brand-200 p-3" /></div>
        <div><label htmlFor="alergi" className="mb-1 block text-sm font-semibold">Alergi (obat/makanan)</label><textarea id="alergi" name="alergi" rows={2} value={f.values.alergi ?? ''} onChange={f.onChange} className="w-full rounded-lg border border-brand-200 p-3" /></div>
        <button className="btn btn-primary" disabled={f.busy}>{f.busy ? 'Menyimpan…' : 'Simpan'}</button>
      </form>
    </div>
  )
}
