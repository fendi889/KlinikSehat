import { useEffect } from 'react'
import { api } from '../../services/api.js'
import { PageHeader } from '../../components/ui.jsx'
import { Field, Alert, useForm } from '../auth/AuthShell.jsx'

export default function Pengaturan() {
  const f = useForm({ pendaftaran_online_aktif: '1', maks_antrian_per_poli: '100', batas_batal_jam: '1', email_kontak: '' }, async (v, setOk) => {
    await api('/super-admin/settings', { method: 'PUT', body: v }); setOk('Pengaturan disimpan.')
  })
  const { setValues } = f
  useEffect(() => { api('/super-admin/settings').then((s) => setValues((v) => ({ ...v, ...s }))).catch(() => {}) }, [setValues])
  const p = (n) => ({ name: n, value: f.values[n] ?? '', onChange: f.onChange, error: f.errors[n] })
  return (
    <div className="max-w-xl">
      <PageHeader title="Pengaturan sistem" />
      <form onSubmit={f.onSubmit} className="space-y-4 rounded-xl border border-brand-200 bg-white p-5" noValidate>
        <Alert>{f.message}</Alert><Alert kind="ok">{f.ok}</Alert>
        <div>
          <label htmlFor="po" className="mb-1 block text-sm font-semibold">Pendaftaran online</label>
          <select id="po" name="pendaftaran_online_aktif" value={f.values.pendaftaran_online_aktif} onChange={f.onChange} className="min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3">
            <option value="1">Aktif</option><option value="0">Ditutup</option>
          </select>
        </div>
        <Field label="Maksimal antrian per poli per hari" type="number" {...p('maks_antrian_per_poli')} />
        <Field label="Batas pembatalan (jam sebelum jadwal)" type="number" {...p('batas_batal_jam')} />
        <Field label="Email kontak" type="email" {...p('email_kontak')} />
        <button className="btn btn-primary" disabled={f.busy}>{f.busy ? 'Menyimpan…' : 'Simpan'}</button>
      </form>
    </div>
  )
}
