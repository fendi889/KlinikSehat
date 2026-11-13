import { useEffect } from 'react'
import { api } from '../../services/api.js'
import { PageHeader } from '../../components/ui.jsx'
import { Field, Alert, useForm } from '../auth/AuthShell.jsx'

export default function Klinik({ base = '/super-admin' }) {
  const f = useForm({ nama: '', alamat: '', telp: '', email: '', jam_buka: '' }, async (v, setOk) => {
    await api(`${base}/clinic`, { method: 'PUT', body: v }); setOk('Data klinik disimpan.')
  })
  const { setValues } = f
  useEffect(() => {
    api(`${base}/clinic`).then((c) => setValues({ nama: c.nama || '', alamat: c.alamat || '', telp: c.telp || '', email: c.email || '', jam_buka: c.jam_buka || '' })).catch(() => {})
  }, [setValues, base])
  const p = (n) => ({ name: n, value: f.values[n], onChange: f.onChange, error: f.errors[n] })
  return (
    <div className="max-w-xl">
      <PageHeader title="Klinik" desc="Data ini tampil di halaman publik dan dokumen klinik." />
      <form onSubmit={f.onSubmit} className="space-y-4 rounded-xl border border-brand-200 bg-white p-5" noValidate>
        <Alert>{f.message}</Alert><Alert kind="ok">{f.ok}</Alert>
        <Field label="Nama klinik" {...p('nama')} /><Field label="Alamat" {...p('alamat')} />
        <Field label="Telepon" {...p('telp')} /><Field label="Email" type="email" {...p('email')} />
        <Field label="Jam buka" {...p('jam_buka')} />
        <button className="btn btn-primary" disabled={f.busy}>{f.busy ? 'Menyimpan…' : 'Simpan'}</button>
      </form>
    </div>
  )
}
