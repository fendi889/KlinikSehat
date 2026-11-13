import { useEffect, useState, useCallback } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, Empty, tglPanjang } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Ulasan() {
  const [d, setD] = useState(null)
  const [form, setForm] = useState(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const load = useCallback(() => api('/pasien/reviews').then(setD).catch((e) => setErr(e.message)), [])
  useEffect(() => { load() }, [load])

  const kirim = async (e) => {
    e.preventDefault(); setErr(''); setOk('')
    try { await api('/pasien/reviews', { method: 'POST', body: { visit_id: form.id, rating: Number(form.rating), ulasan: form.ulasan || null } }); setForm(null); setOk('Terima kasih atas ulasan Anda. Ulasan ditinjau admin sebelum ditampilkan.'); load() }
    catch (x) { setErr(x.message) }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Ulasan" desc="Bagikan pengalaman Anda setelah kunjungan selesai." />
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      {form && (
        <form onSubmit={kirim} className="my-4 space-y-3 rounded-xl border border-brand-200 bg-white p-5">
          <h2 className="font-semibold">Ulasan kunjungan {tglPanjang(form.tanggal)} · {form.poli_nama}</h2>
          <div><label htmlFor="rt" className="mb-1 block text-sm font-semibold">Penilaian</label>
            <select id="rt" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="min-h-[44px] rounded-lg border border-brand-200 bg-white px-3">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} dari 5</option>)}
            </select></div>
          <textarea aria-label="Ulasan" rows={3} maxLength={500} placeholder="Ceritakan pengalaman Anda" value={form.ulasan} onChange={(e) => setForm({ ...form, ulasan: e.target.value })} className="w-full rounded-lg border border-brand-200 p-3" />
          <div className="flex gap-3"><button className="btn btn-primary">Kirim</button><button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Batal</button></div>
        </form>
      )}
      {d && <>
        <h2 className="mb-2 mt-4 font-semibold">Kunjungan yang bisa diulas</h2>
        {d.bisa_diulas.length === 0 ? <Empty>Tidak ada kunjungan yang menunggu ulasan.</Empty> : (
          <ul className="space-y-2">{d.bisa_diulas.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-white p-4">
              <span><b>{tglPanjang(v.tanggal)}</b><br /><span className="text-sm text-brand-700">{v.poli_nama} · {v.doctor_nama}</span></span>
              <button className="btn btn-outline min-h-[40px]" onClick={() => setForm({ ...v, rating: 5, ulasan: '' })}>Beri ulasan</button>
            </li>))}</ul>
        )}
        <h2 className="mb-2 mt-8 font-semibold">Ulasan saya</h2>
        {d.ulasan.length === 0 ? <Empty>Belum ada ulasan.</Empty> : (
          <ul className="space-y-2">{d.ulasan.map((u) => (
            <li key={u.id} className="rounded-xl border border-brand-200 bg-white p-4"><p className="font-semibold">{'★'.repeat(u.rating)}{'☆'.repeat(5 - u.rating)} <span className="text-sm font-normal text-brand-700">{u.tampil ? 'Ditampilkan' : 'Menunggu tinjauan'}</span></p>{u.ulasan && <p className="text-sm">{u.ulasan}</p>}</li>))}</ul>
        )}
      </>}
    </div>
  )
}
