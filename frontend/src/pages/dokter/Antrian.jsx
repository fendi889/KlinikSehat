import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import { PageHeader, StatusBadge, Empty } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Antrian() {
  const nav = useNavigate()
  const [list, setList] = useState(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const load = useCallback(() => api('/dokter/queue').then(setList).catch((e) => setErr(e.message)), [])
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

  const panggil = async (q) => { setErr(''); setOk(''); try { const r = await api(`/dokter/queue/${q.id}/call`, { method: 'POST' }); setOk(r.message); playAnnouncement(q.kode, q.pasien, q.poli_nama); load() } catch (e) { setErr(e.message) } }
  const mulai = async (q) => { setErr(''); try { await api(`/dokter/visits/${q.visit_id}/start`, { method: 'POST' }); nav(`/dokter/pemeriksaan/${q.visit_id}`) } catch (e) { setErr(e.message) } }

  return (
    <div className="max-w-4xl">
      <PageHeader title="Antrian hari ini" desc="Diperbarui otomatis tiap 5 detik. Pasien melihat panggilan di dashboard mereka." />
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      {!list ? <p className="text-brand-700">Memuat…</p> : list.length === 0 ? <Empty>Belum ada pasien terdaftar hari ini.</Empty> : (
        <ul className="mt-4 space-y-3">
          {list.map((q) => (
            <li key={q.id} className="rounded-xl border border-brand-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className="font-display text-3xl font-bold text-brand-500">{q.kode}</span>
                  <div>
                    <p className="font-semibold">{q.pasien} <span className="font-normal text-brand-700">· {q.no_rm} · {q.umur ?? '-'} th · {q.jenis_kelamin ?? '-'}</span></p>
                    <p className="text-sm text-brand-700">{q.keluhan || 'Tanpa keluhan tertulis'}{q.ada_tanda_vital && ' · tanda vital sudah diinput'}</p>
                  </div>
                </div>
                <StatusBadge status={q.status} />
              </div>
              {q.alergi && <p className="mt-2 rounded-lg bg-yellow-50 p-2 text-sm text-yellow-800">Alergi: {q.alergi}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {['menunggu', 'terlewat', 'dipanggil'].includes(q.status) && <button className="btn btn-outline min-h-[40px]" onClick={() => panggil(q)}>{q.status === 'dipanggil' ? 'Panggil lagi' : 'Panggil'}</button>}
                {['menunggu', 'terlewat', 'dipanggil'].includes(q.status) && <button className="btn btn-primary min-h-[40px]" onClick={() => mulai(q)}>Mulai periksa</button>}
                {q.status === 'dilayani' && <Link className="btn btn-primary min-h-[40px]" to={`/dokter/pemeriksaan/${q.visit_id}`}>Lanjutkan pemeriksaan</Link>}
                {q.status === 'selesai' && <Link className="btn btn-outline min-h-[40px]" to={`/dokter/pemeriksaan/${q.visit_id}`}>Lihat</Link>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
