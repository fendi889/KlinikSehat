import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api.js'
import { PageHeader, StatusBadge, StatCard, Empty } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Antrian({ role = 'perawat' }) {
  const base = role === 'admin' ? '/admin' : '/perawat'
  const [d, setD] = useState(null)
  const [poli, setPoli] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const load = useCallback(() => api(`${base}/queue${poli ? `?poli_id=${poli}` : ''}`).then(setD).catch((e) => setErr(e.message)), [poli])
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t) }, [load])

  const playAnnouncement = (kode, pasien, poli) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const text = `Nomor antrean ${kode}, atas nama ${pasien}, silakan menuju ke ${poli || 'ruang pemeriksaan'}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('Speech synthesis error:', e);
      }
    }
  };

  const aksi = async (path, pesan, q) => { setErr(''); setOk(''); try { const r = await api(path, { method: 'POST' }); setOk(r.message || pesan); if (q) playAnnouncement(q.kode, q.pasien, q.poli_nama); load() } catch (e) { setErr(e.message) } }
  const polis = d ? [...new Map(d.antrian.map((a) => [a.poli_id, a.poli_nama]))] : []
  const R = d?.ringkasan || {}

  return (
    <div className="max-w-5xl">
      <PageHeader title="Antrian dan status pelayanan" desc="Semua poli hari ini. Diperbarui otomatis tiap 5 detik." />
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      <dl className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[['menunggu', 'Menunggu'], ['dipanggil', 'Dipanggil'], ['dilayani', 'Dilayani'], ['selesai', 'Selesai'], ['batal', 'Batal']].map(([k, l]) => <StatCard key={k} label={l} value={R[k] || 0} />)}
      </dl>
      <select aria-label="Filter poli" className="mb-4 min-h-[44px] rounded-lg border border-brand-200 bg-white px-3" value={poli} onChange={(e) => setPoli(e.target.value)}>
        <option value="">Semua poli</option>{polis.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
      </select>
      {!d ? <p className="text-brand-700">Memuat…</p> : d.antrian.length === 0 ? <Empty>Belum ada antrian hari ini.</Empty> : (
        <ul className="space-y-3">{d.antrian.map((q) => (
          <li key={q.id} className="rounded-xl border border-brand-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-4"><span className="font-display text-3xl font-bold text-brand-500">{q.kode}</span>
                <div><p className="font-semibold">{q.pasien} <span className="font-normal text-brand-700">· {q.no_rm} · {q.umur ?? '-'} th</span></p>
                  <p className="text-sm text-brand-700">{q.poli_nama} · {q.dokter}{q.ruang && ` · ${q.ruang}`}</p></div></div>
              <div className="flex gap-2"><StatusBadge status={q.status} /><StatusBadge status={q.visit_status} /></div>
            </div>
            {q.alergi && <p className="mt-2 rounded-lg bg-yellow-50 p-2 text-sm text-yellow-800">Alergi: {q.alergi}</p>}
            {!['selesai', 'batal'].includes(q.visit_status) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {['menunggu', 'terlewat', 'dipanggil'].includes(q.status) && <button className="btn btn-outline min-h-[40px]" onClick={() => aksi(`${base}/queue/${q.id}/call`, null, q)}>{q.status === 'dipanggil' ? 'Panggil lagi' : 'Panggil'}</button>}
                {role === 'perawat' && q.visit_status === 'terdaftar' && <button className="btn btn-outline min-h-[40px]" onClick={() => aksi(`/perawat/visits/${q.visit_id}/verify`)}>Verifikasi</button>}
                {['menunggu', 'dipanggil'].includes(q.status) && <button className="btn btn-outline min-h-[40px]" onClick={() => aksi(`${base}/queue/${q.id}/skip`)}>Lewati</button>}
                {q.status === 'terlewat' && <button className="btn btn-outline min-h-[40px]" onClick={() => aksi(`${base}/queue/${q.id}/requeue`)}>Masukkan kembali</button>}
                {!['dilayani', 'selesai', 'batal'].includes(q.status) && q.visit_status !== 'diperiksa' && <button className="btn btn-outline min-h-[40px] text-red-600" onClick={() => { if (window.confirm(`Batalkan antrian ${q.kode}?`)) aksi(`${base}/queue/${q.id}/cancel`) }}>Batalkan</button>}
                {role === 'perawat' && ['terdaftar', 'diverifikasi', 'menunggu_dokter'].includes(q.visit_status) && <Link className="btn btn-primary min-h-[40px]" to={`/perawat/tanda-vital?visit=${q.visit_id}`}>{q.ada_tanda_vital ? 'Ubah tanda vital' : 'Input tanda vital'}</Link>}
              </div>
            )}
          </li>))}</ul>
      )}
    </div>
  )
}
