import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { PageHeader, Pager, TableWrap, Th, Td, Empty } from './ui.jsx'
import { Field, Alert } from '../pages/auth/AuthShell.jsx'

/**
 * Halaman CRUD generik.
 * fields: { name, label, type?, options?, required?, createOnly?, editOnly? }
 * optionSources: { namaField: { endpoint, value, label } }
 */
export default function CrudPage({ title, desc, endpoint, columns, fields, blank, searchable = false, optionSources = {}, nounHapus = 'data', extraAction = null, canDelete = true }) {
  const [rows, setRows] = useState(null)
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [q, setQ] = useState('')
  const [opts, setOpts] = useState({})
  const [form, setForm] = useState(null)
  const [fe, setFe] = useState({})
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    const qs = searchable ? `?${new URLSearchParams({ page: pg, ...(q && { q }) })}` : ''
    api(endpoint + qs).then((r) => {
      if (Array.isArray(r)) { setRows(r); setPage(null) } else { setRows(r.data); setPage(r) }
    }).catch((e) => setErr(e.message))
  }, [endpoint, pg, q, searchable])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    Object.entries(optionSources).forEach(([name, s]) => {
      api(s.endpoint).then((list) => setOpts((o) => ({ ...o, [name]: list.map((x) => ({ value: x[s.value || 'id'], label: typeof s.label === 'function' ? s.label(x) : x[s.label] })) }))).catch(() => {})
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isEdit = !!form?.id
  const visible = fields.filter((f) => (isEdit ? !f.createOnly : !f.editOnly))
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setFe({}); setErr(''); setOk('')
    const body = {}
    visible.forEach((f) => {
      let v = form[f.name]
      if (f.type === 'checkbox') v = !!v
      else if (v === '' || v === undefined) v = null
      if (f.type === 'password' && v === null) return
      body[f.name] = v
    })
    try {
      await api(isEdit ? `${endpoint}/${form.id}` : endpoint, { method: isEdit ? 'PUT' : 'POST', body })
      setForm(null); setOk(isEdit ? 'Perubahan disimpan.' : 'Data ditambahkan.'); load()
    } catch (x) {
      setErr(x.message); setFe(Object.fromEntries(Object.entries(x.errors || {}).map(([k, v]) => [k, v[0]])))
    } finally { setBusy(false) }
  }

  const remove = async (row) => {
    if (!window.confirm(`Hapus ${nounHapus} ini?`)) return
    setErr(''); setOk('')
    try { await api(`${endpoint}/${row.id}`, { method: 'DELETE' }); setOk('Data dihapus.'); load() } catch (x) { setErr(x.message) }
  }

  const input = (f) => {
    const common = { name: f.name, label: f.label + (f.required ? ' *' : ''), error: fe[f.name] }
    if (f.type === 'checkbox') {
      return (
        <label key={f.name} className="flex min-h-[44px] items-center gap-3 font-semibold">
          <input type="checkbox" name={f.name} checked={!!form[f.name]} onChange={set} className="h-5 w-5" />{f.label}
        </label>
      )
    }
    if (f.type === 'select') {
      const list = f.options || opts[f.name] || []
      return (
        <div key={f.name}>
          <label htmlFor={f.name} className="mb-1 block text-sm font-semibold">{common.label}</label>
          <select id={f.name} name={f.name} value={form[f.name] ?? ''} onChange={set} className="min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3">
            <option value="">Pilih…</option>
            {list.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {fe[f.name] && <p className="mt-1 text-sm text-red-600">{fe[f.name]}</p>}
        </div>
      )
    }
    if (f.type === 'textarea') {
      return (
        <div key={f.name} className="md:col-span-2">
          <label htmlFor={f.name} className="mb-1 block text-sm font-semibold">{common.label}</label>
          <textarea id={f.name} name={f.name} rows={3} value={form[f.name] ?? ''} onChange={set} className="w-full rounded-lg border border-brand-200 bg-white p-3" />
          {fe[f.name] && <p className="mt-1 text-sm text-red-600">{fe[f.name]}</p>}
        </div>
      )
    }
    return <Field key={f.name} {...common} type={f.type || 'text'} value={form[f.name] ?? ''} onChange={set} autoComplete={f.type === 'password' ? 'new-password' : undefined} />
  }

  return (
    <div className="w-full">
      <PageHeader title={title} desc={desc}
        action={<div className="flex flex-wrap gap-2 items-center">{extraAction}<button className="btn btn-primary" onClick={() => { setForm({ ...blank }); setFe({}); setErr(''); setOk('') }}>Tambah</button></div>} />
      {searchable && (
        <input aria-label="Cari" placeholder="Cari…" value={q} onChange={(e) => { setQ(e.target.value); setPg(1) }} className="mb-4 min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3 sm:w-72" />
      )}
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>

      {form && (
        <form onSubmit={save} noValidate className="my-4 grid gap-4 rounded-xl border border-brand-200 bg-white p-5 md:grid-cols-2">
          <h2 className="font-semibold md:col-span-2">{isEdit ? 'Ubah data' : 'Tambah data'}</h2>
          {visible.map(input)}
          <div className="flex gap-3 md:col-span-2">
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Batal</button>
          </div>
        </form>
      )}

      <div className="mt-4">
        {!rows ? <p className="text-brand-700">Memuat…</p> : rows.length === 0 ? <Empty>Belum ada data. Tekan Tambah untuk membuat yang pertama.</Empty> : (
          <TableWrap>
            <thead><tr>{columns.map((c) => <Th key={c.label}>{c.label}</Th>)}<Th>Aksi</Th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((c) => <Td key={c.label}>{c.render ? c.render(row) : (row[c.key] ?? '-')}</Td>)}
                  <Td className="space-x-3 whitespace-nowrap">
                    <button className="font-semibold text-brand-500" onClick={() => { setForm({ ...row, password: '' }); setFe({}); setErr(''); setOk('') }}>Ubah</button>
                    {canDelete && <button className="font-semibold text-red-600" onClick={() => remove(row)}>Hapus</button>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        <Pager page={page} onPage={setPg} />
      </div>
    </div>
  )
}
